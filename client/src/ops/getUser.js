/* eslint-disable no-restricted-globals */
import { getParameterByName, cleanUpURL } from '../utils';
import {
  USER_LOADING,
  USER_NONE,
  USER_LOADED,
  OCTOMMENTS_USER,
} from '../constants';

export default function getUser(api) {
  const { notify, error } = api;

  const newCommentURL = api.generateNewCommentURL();
  const lsUser = api.LS.getItem(OCTOMMENTS_USER);
  const clearCurrentURL = () =>
    history.replaceState({}, document.title, cleanUpURL(location.href));

  if (lsUser) {
    try {
      api.user = JSON.parse(lsUser);
      notify(USER_LOADED, api.user, false);
    } catch (err) {
      console.error(err);
      error(new Error('Corrupted data in local storage.'), 5);
    }
  } else if (getParameterByName('t')) {
    const token = getParameterByName('t');
    api.user = { token };
    notify(USER_LOADING);
    fetch(`https://api.github.com/user`, { headers: api.getHeaders() })
      .then((response, err) => {
        if (err || !response.ok) {
          if (err) console.error(err);
          clearCurrentURL();
          error(new Error("Problem getting user's info."), 6);
        } else {
          response
            .json()
            .then(data => {
              api.user = {
                token: api.user.token,
                login: data.login,
                avatarUrl: data.avatar_url,
                url: data.html_url,
                name: data.name,
              };
              clearCurrentURL();
              api.LS.setItem(OCTOMMENTS_USER, JSON.stringify(api.user));
              notify(USER_LOADED, api.user, true);
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
