/* eslint-disable no-restricted-globals */
import {
  getParameterByName,
  getAuthenticationURL,
  cleanUpURL,
  getNewCommentURL,
} from '../utils';
import {
  USER_ERROR,
  LOADING_USER,
  NO_USER,
  USER_LOADED,
  OCTOMMENTS_USER,
} from '../constants';

export default function getUser(api) {
  let { endpoints, gotoComments, github, id } = api.options;

  gotoComments = typeof gotoComments !== 'undefined' ? gotoComments : true;

  api.notify(LOADING_USER);
  const authURL = endpoints ? getAuthenticationURL(endpoints.token) : null;
  const newCommentURL = github ? getNewCommentURL(id, github) : null;
  const lsUser = api.LS.getItem(OCTOMMENTS_USER);
  const code = getParameterByName('code');
  const fail = err => api.notify(USER_ERROR, err, authURL, newCommentURL);
  const clearCurrentURL = () =>
    history.replaceState(
      {},
      document.title,
      `${cleanUpURL(location.href)}${gotoComments ? '#comments' : ''}`
    );

  if (lsUser) {
    try {
      api.user = JSON.parse(lsUser);
      api.notify(USER_LOADED, api.user);
    } catch (err) {
      console.error(err);
      fail(err);
    }
  } else if (code && endpoints) {
    fetch(`${endpoints.token}?code=${code}`)
      .then((response, error) => {
        if (error || !response.ok) {
          clearCurrentURL();
          fail(new Error(`Can't get a token`));
        } else {
          response
            .json()
            .then(data => {
              clearCurrentURL();
              api.LS.setItem(OCTOMMENTS_USER, JSON.stringify(data));
              api.notify(USER_LOADED, data);
              api.user = data;
            })
            .catch(fail);
        }
      })
      .catch(fail);
  } else {
    api.notify(NO_USER, authURL, newCommentURL);
  }
}
