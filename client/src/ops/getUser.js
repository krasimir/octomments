/* eslint-disable no-restricted-globals */
import { getParameterByName, getAuthenticationURL, cleanUpURL } from '../utils';
import {
  USER_ERROR,
  LOADING_CURRENT_USER,
  NO_USER,
  USER_LOADED,
  OCTOMMENTS_USER,
} from '../constants';

export default function getUser(api) {
  let { endpoints, gotoComments } = api.options;

  gotoComments = typeof gotoComments !== 'undefined' ? gotoComments : true;

  api.notify(LOADING_CURRENT_USER);
  const lsUser = api.LS.getItem(OCTOMMENTS_USER);
  const code = getParameterByName('code');
  const fail = err =>
    api.notify(USER_ERROR, err, getAuthenticationURL(endpoints.token));
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
  } else if (code) {
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
    api.notify(NO_USER, getAuthenticationURL(endpoints.token));
  }
}
