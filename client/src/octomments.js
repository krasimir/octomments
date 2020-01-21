import Storage from './storage';
import {
  getParameterByName,
  suggestIssueCreation,
  getAuthenticationURL,
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

  const api = {};
  const { endpoints, id, githubClientId } = options;
  const notify = options.on || (() => {});
  const onCommentsError = e => notify(Octomments.COMMENTS_ERROR, e);
  const onUserError = e => notify(Octomments.USER_ERROR, e);

  function getIssue() {
    notify(Octomments.LOADING_COMMENTS);
    fetch(`${endpoints.issue}?id=${id}`)
      .then((response, error) => {
        if (error) {
          onCommentsError(error);
        } else if (!response.ok) {
          if (response.status === 404) {
            suggestIssueCreation(id, endpoints.issue);
            notify(Octomments.NO_GITHUB_ISSUE_CREATED);
          } else {
            onCommentsError(new Error("Problem getting issue's data"));
          }
        } else {
          response
            .json()
            .then(data => {
              console.log(JSON.stringify(data, null, 2));
              if (data.issue.comments) {
                notify(Octomments.COMMENTS_LOADED, data.issue.comments);
              } else {
                onCommentsError(
                  new Error(
                    'Data is fetched successfully but it is in a wrong format'
                  )
                );
              }
            })
            .catch(onCommentsError);
        }
      })
      .catch(onCommentsError);
  }

  function getUser() {
    notify(Octomments.LOADING_CURRENT_USER);
    const lsUser = LS.getItem(OCTOMMENTS_USER);
    const code = getParameterByName('code');

    if (code) {
      fetch(`${endpoints.token}?code=${code}`).then((response, error) => {
        if (error || !response.ok) {
          onUserError(getAuthenticationURL(githubClientId));
        } else {
          response.json().then(data => {
            LS.setItem(OCTOMMENTS_USER, data);
            notify(Octomments.USER_LOADED, JSON.stringify(data));
          });
        }
      });
    } else if (lsUser) {
      console.log('validate user');
    } else {
      notify(Octomments.NO_CURRENT_USER, getAuthenticationURL(githubClientId));
    }
  }

  getIssue();
  getUser();

  return api;
}

Octomments.LOADING_COMMENTS = 'LOADING_COMMENTS';
Octomments.COMMENTS_LOADED = 'COMMENTS_LOADED';
Octomments.NO_GITHUB_ISSUE_CREATED = 'NO_GITHUB_ISSUE_CREATED';
Octomments.COMMENTS_ERROR = 'COMMENTS_ERROR';
Octomments.USER_ERROR = 'USER_ERROR';
Octomments.LOADING_CURRENT_USER = 'LOADING_CURRENT_USER';
Octomments.NO_CURRENT_USER = 'NO_CURRENT_USER';
Octomments.USER_LOADED = 'USER_LOADED';

export default Octomments;
