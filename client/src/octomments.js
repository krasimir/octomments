/* eslint-disable no-restricted-globals, no-nested-ternary */
import Storage from './storage';
import getUser from './ops/getUser';
import getIssueComments from './ops/getIssueComments';
import addComment from './ops/addComment';
import { CONSTANTS, OCTOMMENTS_USER, ERROR } from './constants';
import { getAuthenticationURL } from './utils';

function Octomments(options) {
  if (!options) throw new Error('Octomments options required.');
  if (!options.github || !options.github.owner || !options.github.repo)
    throw new Error('`options.github` is missing or incomplete.');
  if (!options.issueNumber)
    throw new Error('`options.issueNumber` is missing.');
  if (!options.endpoints) {
    options.endpoints = {
      issue: 'https://ocs.now.sh/octomments/issue',
      token: 'https://ocs.now.sh/octomments/token',
    };
  }
  if (options.debug) {
    console.log('Octomments started with: ', JSON.stringify(options, null, 2));
  }

  const listeners = {};
  const api = {
    user: null,
    data: { comments: [], pagination: null },
    options,
    LS: Storage(),
  };

  api.error = (e, meta) => {
    api.notify(ERROR, e, meta);
  };
  api.notify = function(type, ...payload) {
    if (options.debug) console.log(type, payload);
    if (listeners[type]) listeners[type].forEach(cb => cb(...payload));
  };
  api.initUser = () => getUser(api);
  api.initComments = () => getIssueComments(api);
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
    getAuthenticationURL(options.endpoints.token);
  api.getHeaders = () => {
    const headers = {};
    headers['Content-Type'] = 'application/json';
    headers.Accept = 'application/vnd.github.v3.html+json';
    if (api.user && api.user.token) {
      headers.Authorization = `token ${api.user.token}`;
    }
    return headers;
  };

  CONSTANTS.forEach(c => (api[c] = c));

  if (options.renderer) {
    const [r, ...otherArgs] = options.renderer;
    r(api, ...otherArgs);
  }

  return api;
}

CONSTANTS.forEach(c => (Octomments[c] = c));

Octomments.version = '{version}';

export default Octomments;
