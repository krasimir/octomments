/* eslint-disable no-restricted-globals, no-nested-ternary */
import Storage from './storage';
import getUser from './ops/getUser';
import getIssueComments from './ops/getIssueComments';
import addComment from './ops/addComment';
import { CONSTANTS, OCTOMMENTS_USER, ERROR } from './constants';
import { getAuthenticationURL, getNewCommentURL } from './utils';

function Octomments(options) {
  if (!options) throw new Error('Octomments options required.');
  if (!options.github || !options.github.owner || !options.github.repo)
    throw new Error('`options.github` is missing or incomplete.');
  if (!options.number) throw new Error('`options.number` is missing.');

  const listeners = {};
  const api = {
    user: null,
    data: { comments: [], pagination: null },
    options,
    LS: Storage(),
  };

  // internal
  api.error = (e, meta) => {
    api.notify(ERROR, e, meta);
  };
  api.notify = function(type, ...payload) {
    if (options.debug) console.log(type, payload);
    if (listeners[type]) listeners[type].forEach(cb => cb(...payload));
  };
  api.initUser = () => getUser(api);
  api.initComments = () => getIssueComments(api);
  // public
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
    api.initUser();
    api.initComments();
  };
  api.page = function(index) {
    getIssueComments(api, index);
  };
  api.generateNewCommentURL = () =>
    options.endpoints
      ? getAuthenticationURL(options.endpoints.token)
      : options.github
      ? getNewCommentURL(options.number, options.github)
      : null;

  CONSTANTS.forEach(c => (api[c] = c));

  if (options.renderer) {
    const [r, ...otherArgs] = options.renderer;
    r(api, ...otherArgs);
  }

  return api;
}

CONSTANTS.forEach(c => (Octomments[c] = c));
export default Octomments;
