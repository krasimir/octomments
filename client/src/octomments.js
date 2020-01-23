/* eslint-disable no-restricted-globals */
import Storage from './storage';
import getUser from './ops/getUser';
import getIssue from './ops/getIssue';
import addComment from './ops/addComment';
import {
  LOADING_COMMENTS,
  COMMENTS_LOADED,
  COMMENTS_ERROR,
  USER_ERROR,
  LOADING_CURRENT_USER,
  NO_USER,
  USER_LOADED,
  SAVING_COMMENT,
  COMMENT_SAVED,
  COMMENT_ERROR,
  OCTOMMENTS_USER,
} from './constants';

function Octomments(options) {
  if (!options) throw new Error('Octomments options required.');
  if (
    !options.endpoints ||
    !options.endpoints.issue ||
    !options.endpoints.token
  )
    throw new Error('`options.endpoints` are missing or incomplete.');
  if (!options.id) throw new Error('`options.id` is missing.');

  const listeners = {};
  const api = { user: null, options, LS: Storage() };
  const debug = typeof options.debug !== 'undefined' ? options.debug : false;

  api.notify = function(type, payload) {
    if (debug) console.log(type);
    if (listeners[type]) listeners[type].forEach(cb => cb(payload));
  };
  api.logout = function(refresh = true) {
    api.user = null;
    api.LS.removeItem(OCTOMMENTS_USER);
    if (refresh) location.reload();
  };
  api.add = function(text) {
    if (!api.user) {
      throw new Error('No user logged in.');
    }
    addComment(api, text);
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
    getUser(api);
    getIssue(api);
  };

  return api;
}

Octomments.LOADING_COMMENTS = LOADING_COMMENTS;
Octomments.COMMENTS_LOADED = COMMENTS_LOADED;
Octomments.COMMENTS_ERROR = COMMENTS_ERROR;
Octomments.USER_ERROR = USER_ERROR;
Octomments.LOADING_CURRENT_USER = LOADING_CURRENT_USER;
Octomments.NO_USER = NO_USER;
Octomments.USER_LOADED = USER_LOADED;
Octomments.SAVING_COMMENT = SAVING_COMMENT;
Octomments.COMMENT_SAVED = COMMENT_SAVED;
Octomments.NEW_COMMENT_ERROR = COMMENT_ERROR;

export default Octomments;
