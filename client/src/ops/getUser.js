/* eslint-disable no-restricted-globals, no-nested-ternary */
import {
  getParameterByName,
  getAuthenticationURL,
  cleanUpURL,
  getNewCommentURL,
} from '../utils';
import {
  USER_LOADING,
  USER_NONE,
  USER_LOADED,
  OCTOMMENTS_USER,
} from '../constants';

export default function getUser(api) {
  const { notify, options, error } = api;
  let { endpoints, gotoComments, github, number } = options;

  gotoComments = typeof gotoComments !== 'undefined' ? gotoComments : true;
  notify(USER_LOADING);

  const newCommentURL = endpoints
    ? getAuthenticationURL(endpoints.token)
    : github
    ? getNewCommentURL(number, github)
    : null;
  const lsUser = api.LS.getItem(OCTOMMENTS_USER);
  const clearCurrentURL = () =>
    history.replaceState(
      {},
      document.title,
      `${cleanUpURL(location.href)}${gotoComments ? '#comments' : ''}`
    );

  if (lsUser) {
    try {
      api.user = JSON.parse(lsUser);
      notify(USER_LOADED, api.user);
    } catch (err) {
      console.error(err);
      error(new Error('Corrupted data in local storage.'), 5);
    }
  } else if (endpoints && getParameterByName('code')) {
    fetch(`${endpoints.token}?code=${getParameterByName('code')}`)
      .then((response, err) => {
        if (err || !response.ok) {
          if (err) console.error(err);
          clearCurrentURL();
          error(new Error('Problem getting access token.'), 6);
        } else {
          response
            .json()
            .then(data => {
              clearCurrentURL();
              api.LS.setItem(OCTOMMENTS_USER, JSON.stringify(data));
              notify(USER_LOADED, data);
              api.user = data;
            })
            .catch(err => {
              console.error(err);
              error(new Error('Problem parsing access token response.'), 7);
            });
        }
      })
      .catch(err => {
        console.error(err);
        error(new Error('Problem getting access token.'), 6);
      });
  } else {
    notify(USER_NONE, newCommentURL);
  }
}
