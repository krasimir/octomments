/* eslint-disable no-restricted-globals */
import Storage from './storage';
import {
  getParameterByName,
  suggestIssueCreation,
  getAuthenticationURL,
  cleanUpURL,
} from './utils';

const OCTOMMENTS_USER = 'OCTOMMENTS_USER';
const LS = Storage();

function Octomments(options) {
  if (!options) throw new Error('Octomments options required.');
  if (
    !options.endpoints ||
    !options.endpoints.issue ||
    !options.endpoints.token
  )
    throw new Error('`options.endpoints` are missing or incomplete.');
  if (!options.id) throw new Error('`options.id` is missing.');
  if (!options.githubClientId)
    throw new Error('`options.githubClientId` is missing.');

  const listeners = {};
  const api = {
    user: null,
  };
  const { endpoints, id, githubClientId } = options;
  const gotoComments =
    typeof options.gotoComments !== 'undefined' ? options.gotoComments : true;
  const notify = (type, payload) => {
    console.log(type);
    if (listeners[type]) listeners[type].forEach(cb => cb(payload));
  };
  const onError = type => (e, other) => notify(type, e, other);

  function getUser() {
    notify(Octomments.LOADING_CURRENT_USER);
    const lsUser = LS.getItem(OCTOMMENTS_USER);
    const code = getParameterByName('code');
    const fail = err =>
      onError(Octomments.USER_ERROR)(err, getAuthenticationURL(githubClientId));

    if (lsUser) {
      try {
        api.user = JSON.parse(lsUser);
        notify(Octomments.USER_LOADED, api.user);
      } catch (err) {
        console.error(err);
        fail(err);
      }
    } else if (code) {
      fetch(`${endpoints.token}?code=${code}`)
        .then((response, error) => {
          if (error || !response.ok) {
            history.replaceState({}, document.title, cleanUpURL(location.href));
            fail(new Error(`Can't get a token`));
          } else {
            response.json().then(data => {
              history.replaceState(
                {},
                document.title,
                `${cleanUpURL(location.href)}${gotoComments ? '#comments' : ''}`
              );
              LS.setItem(OCTOMMENTS_USER, JSON.stringify(data));
              notify(Octomments.USER_LOADED, data);
              api.user = data;
            });
          }
        })
        .catch(fail);
    } else {
      notify(Octomments.NO_USER, getAuthenticationURL(githubClientId));
    }
  }

  function extractComments(response, event) {
    const fail = onError(Octomments.COMMENTS_ERROR);
    response
      .json()
      .then(data => {
        if (data.issue.comments) {
          notify(event, data.issue.comments);
        } else {
          fail(
            new Error(
              'Data is fetched successfully but it is in a wrong format'
            )
          );
        }
      })
      .catch(fail);
  }

  function getIssue() {
    const fail = onError(Octomments.COMMENTS_ERROR);
    notify(Octomments.LOADING_COMMENTS);
    fetch(`${endpoints.issue}?id=${id}`)
      .then((response, error) => {
        if (error) {
          fail(error);
        } else if (!response.ok) {
          if (response.status === 404) {
            suggestIssueCreation(id, endpoints.issue);
            notify(Octomments.NO_GITHUB_ISSUE_CREATED);
          } else {
            fail(new Error("Problem getting issue's data"));
          }
        } else {
          extractComments(response, Octomments.COMMENTS_LOADED);
        }
      })
      .catch(fail);
  }

  function addComment(text) {
    const fail = onError(Octomments.NEW_COMMENT_ERROR);
    fetch(`${endpoints.issue}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: true,
        body: text,
        token: api.user.token,
        id,
      }),
    })
      .then((response, error) => {
        if (error) {
          return fail(error);
        }
        if (!response.ok) {
          if (response.status === 401) {
            api.user = null;
            LS.removeItem(OCTOMMENTS_USER);
            notify(Octomments.NO_USER);
            return fail(new Error('Not authorized. Log in again.'));
          }
          return fail(new Error('Adding a new comment failed.'));
        }
        extractComments(response, Octomments.COMMENT_SAVED);
      })
      .catch(fail);
  }

  api.logout = function() {
    api.user = null;
    LS.removeItem(OCTOMMENTS_USER);
    location.reload();
  };
  api.add = function(text) {
    if (!api.user) {
      throw new Error('No user logged in.');
    }
    notify(Octomments.SAVING_COMMENT);
    addComment(text);
  };
  api.off = function(type) {
    delete listeners[type];
    return this;
  };
  api.on = function(type, callback) {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(callback);
    return this;
  };
  api.init = function() {
    getUser();
    getIssue();
  };

  return api;
}

Octomments.LOADING_COMMENTS = 'LOADING_COMMENTS';
Octomments.COMMENTS_LOADED = 'COMMENTS_LOADED';
Octomments.NO_GITHUB_ISSUE_CREATED = 'NO_GITHUB_ISSUE_CREATED';
Octomments.COMMENTS_ERROR = 'COMMENTS_ERROR';
Octomments.USER_ERROR = 'USER_ERROR';
Octomments.LOADING_CURRENT_USER = 'LOADING_CURRENT_USER';
Octomments.NO_USER = 'NO_USER';
Octomments.USER_LOADED = 'USER_LOADED';
Octomments.SAVING_COMMENT = 'SAVING_COMMENT';
Octomments.COMMENT_SAVED = 'COMMENT_SAVED';
Octomments.NEW_COMMENT_ERROR = 'NEW_COMMENT_ERROR';

export default Octomments;
