/* eslint-disable no-restricted-globals */
import Storage from './storage';
import getUser from './ops/getUser';
import getIssueComments from './ops/getIssueComments';
import addComment from './ops/addComment';
import {
  LOADING_COMMENTS,
  COMMENTS_LOADED,
  COMMENTS_ERROR,
  USER_ERROR,
  LOADING_USER,
  NO_USER,
  USER_LOADED,
  SAVING_COMMENT,
  COMMENT_SAVED,
  COMMENT_ERROR,
  OCTOMMENTS_USER,
} from './constants';

function Octomments(options) {
  if (!options) throw new Error('Octomments options required.');
  if (!options.github || !options.github.owner || !options.github.repo)
    throw new Error('`options.github` is missing or incomplete.');
  if (!options.id) throw new Error('`options.id` is missing.');

  const listeners = {};
  const api = {
    user: null,
    data: { comments: [], pagination: null },
    options,
    LS: Storage(),
  };

  api.notify = function(type, ...payload) {
    if (options.debug) console.log(type);
    if (listeners[type]) listeners[type].forEach(cb => cb(...payload));
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
    getIssueComments(api);
  };
  api.page = function(index) {
    getIssueComments(api, index);
  };

  api.LOADING_COMMENTS = LOADING_COMMENTS;
  api.COMMENTS_LOADED = COMMENTS_LOADED;
  api.COMMENTS_ERROR = COMMENTS_ERROR;
  api.USER_ERROR = USER_ERROR;
  api.LOADING_USER = LOADING_USER;
  api.NO_USER = NO_USER;
  api.USER_LOADED = USER_LOADED;
  api.SAVING_COMMENT = SAVING_COMMENT;
  api.COMMENT_SAVED = COMMENT_SAVED;
  api.NEW_COMMENT_ERROR = COMMENT_ERROR;

  if (options.renderer) {
    const [r, ...otherArgs] = options.renderer;
    r(api, ...otherArgs);
  }

  return api;
}

Octomments.LOADING_COMMENTS = LOADING_COMMENTS;
Octomments.COMMENTS_LOADED = COMMENTS_LOADED;
Octomments.COMMENTS_ERROR = COMMENTS_ERROR;
Octomments.USER_ERROR = USER_ERROR;
Octomments.LOADING_USER = LOADING_USER;
Octomments.NO_USER = NO_USER;
Octomments.USER_LOADED = USER_LOADED;
Octomments.SAVING_COMMENT = SAVING_COMMENT;
Octomments.COMMENT_SAVED = COMMENT_SAVED;
Octomments.NEW_COMMENT_ERROR = COMMENT_ERROR;

export default Octomments;
