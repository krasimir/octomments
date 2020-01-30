(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Octomments = factory());
}(this, (function () { 'use strict';

  function _toArray(arr) {
    return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest();
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  function Storage() {
    function lsTest() {
      var test = 'test';

      try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    }

    if (lsTest() === true) {
      return localStorage;
    }

    return {
      setItem: function setItem() {},
      getITem: function getITem() {}
    };
  }

  /* eslint-disable guard-for-in */
  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp("[?&]".concat(name, "(=([^&#]*)|&|#|$)"));
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
  function cleanUpURL(url) {
    ['code', 'error', 'error_description', 'error_uri', 't'].forEach(function (a) {
      url = url.replace(new RegExp("[?&]".concat(a, "=[^&]+")), '');
    });
    return url;
  }
  function getAuthenticationURL(tokenURL) {
    var url = cleanUpURL(window.location.href);
    return "".concat(tokenURL, "?redirect=").concat(encodeURI(url));
  }
  function normalizeComment(item) {
    return {
      id: item.id,
      url: item.html_url,
      author: {
        login: item.user.login,
        avatarUrl: item.user.avatar_url,
        url: item.user.html_url
      },
      body: item.body_html,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }

  var ERROR = 'ERROR';
  var USER_LOADING = 'USER_LOADING';
  var USER_NONE = 'USER_NONE';
  var USER_LOADED = 'USER_LOADED';
  var COMMENTS_LOADING = 'COMMENTS_LOADING';
  var COMMENTS_LOADED = 'COMMENTS_LOADED';
  var COMMENT_SAVING = 'COMMENT_SAVING';
  var COMMENT_SAVED = 'COMMENT_SAVED';
  var OCTOMMENTS_USER = 'OCTOMMENTS_USER';
  var CONSTANTS = [ERROR, COMMENTS_LOADING, COMMENTS_LOADED, COMMENT_SAVING, USER_LOADING, USER_NONE, USER_LOADED, COMMENT_SAVED];

  /* eslint-disable no-restricted-globals */
  function getUser(api) {
    var notify = api.notify,
        options = api.options,
        error = api.error;
    var gotoComments = options.gotoComments;
    gotoComments = typeof gotoComments !== 'undefined' ? gotoComments : true;
    var newCommentURL = api.generateNewCommentURL();
    var lsUser = api.LS.getItem(OCTOMMENTS_USER);

    var clearCurrentURL = function clearCurrentURL() {
      return history.replaceState({}, document.title, "".concat(cleanUpURL(location.href)).concat(gotoComments ? '#comments' : ''));
    };

    if (lsUser) {
      try {
        api.user = JSON.parse(lsUser);
        notify(USER_LOADED, api.user);
      } catch (err) {
        console.error(err);
        error(new Error('Corrupted data in local storage.'), 5);
      }
    } else if (getParameterByName('t')) {
      var token = getParameterByName('t');
      api.user = {
        token: token
      };
      notify(USER_LOADING);
      fetch("https://api.github.com/user", {
        headers: api.getHeaders()
      }).then(function (response, err) {
        if (err || !response.ok) {
          if (err) console.error(err);
          clearCurrentURL();
          error(new Error("Problem getting user's info."), 6);
        } else {
          response.json().then(function (data) {
            api.user = {
              token: api.user.token,
              login: data.login,
              avatarUrl: data.avatar_url,
              url: data.html_url,
              name: data.name
            };
            clearCurrentURL();
            api.LS.setItem(OCTOMMENTS_USER, JSON.stringify(api.user));
            notify(USER_LOADED, api.user);
          })["catch"](function (err) {
            console.error(err);
            error(new Error('Problem parsing access token response.'), 7);
          });
        }
      })["catch"](function (err) {
        console.error(err);
        error(new Error('Problem getting access token.'), 6);
      });
    } else {
      notify(USER_NONE, newCommentURL);
    }
  }

  function getIssueComments(api, p) {
    var notify = api.notify,
        options = api.options,
        error = api.error;
    var endpoints = options.endpoints,
        number = options.number,
        github = options.github;
    var commentsError = new Error("Error getting comments for issue #".concat(number, "."));
    var doesntExist = new Error("Issue #".concat(number, " doesn't exists."));
    notify(COMMENTS_LOADING);

    function catchErrorHandler(err) {
      console.error(err);
      error(commentsError, 2);
    }

    function processResponse(callback) {
      return function (response, err) {
        if (err) {
          error(commentsError, 2);
        } else if (!response.ok) {
          if (response.status === 404) {
            return error(doesntExist, 1);
          }

          callback(response);
        } else {
          callback(response);
        }
      };
    }

    function getIssueCommentsV4() {
      fetch("".concat(endpoints.issue, "?owner=").concat(github.owner, "&repo=").concat(github.repo, "&number=").concat(number)).then(processResponse(function (response) {
        if (!response.ok) {
          error(commentsError, 2);
        } else {
          response.json().then(function (data) {
            var newComments = data.issue.comments;
            api.data = {
              comments: api.data.comments.concat(newComments),
              pagination: null
            };
            notify(COMMENTS_LOADED, newComments, null);
          })["catch"](function (err) {
            console.error(err);
            error(new Error("Error parsing the API response"), 3);
          });
        }
      }))["catch"](catchErrorHandler);
    }


    getIssueCommentsV4();
  }

  function addComment(api, text) {
    var notify = api.notify,
        error = api.error,
        options = api.options;
    var number = options.number,
        github = options.github;
    var failed = new Error('Adding a new comment failed.');
    notify(COMMENT_SAVING);
    var url = "https://api.github.com/repos/".concat(github.owner, "/").concat(github.repo, "/issues/").concat(number, "/comments");

    function catchErrorHandler(err) {
      console.error(err);
      error(failed, 10);
    }

    function processResponse(callback) {
      return function (response, err) {
        if (err) {
          return error(failed, 8);
        }

        if (!response.ok) {
          if (response.status === 401) {
            api.logout(false);
            notify(USER_NONE);
            return error(new Error('Not authorized. Log in again.'), 9);
          }

          if (response.status === 403) {
            return error(new Error('Rate limit exceeded.'), 4);
          }

          return error(failed, 8);
        }

        response.json().then(function (data) {
          if (data) {
            callback(data);
          } else {
            error(new Error('Parsing new-comment response failed.'), 10);
          }
        })["catch"](catchErrorHandler);
      };
    }

    fetch(url, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify({
        body: text
      })
    }).then(processResponse(function (item) {
      notify(COMMENT_SAVED, [normalizeComment(item)]);
    }))["catch"](catchErrorHandler);
  }

  function Octomments(options) {
    if (!options) throw new Error('Octomments options required.');
    if (!options.github || !options.github.owner || !options.github.repo) throw new Error('`options.github` is missing or incomplete.');
    if (!options.number) throw new Error('`options.number` is missing.');

    if (!options.endpoints) {
      options.endpoints = {
        issue: 'https://ocs.now.sh/octomments/issue',
        token: 'https://ocs.now.sh/octomments/token'
      };
    }

    if (options.debug) {
      console.log('Octomments started with: ', JSON.stringify(options, null, 2));
    }

    var listeners = {};
    var api = {
      user: null,
      data: {
        comments: [],
        pagination: null
      },
      options: options,
      LS: Storage()
    };

    api.error = function (e, meta) {
      api.notify(ERROR, e, meta);
    };

    api.notify = function (type) {
      for (var _len = arguments.length, payload = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        payload[_key - 1] = arguments[_key];
      }

      if (options.debug) console.log(type, payload);
      if (listeners[type]) listeners[type].forEach(function (cb) {
        return cb.apply(void 0, payload);
      });
    };

    api.initUser = function () {
      return getUser(api);
    };

    api.initComments = function () {
      return getIssueComments(api);
    };

    api.logout = function () {
      var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      api.user = null;
      api.LS.removeItem(OCTOMMENTS_USER);
      if (refresh) location.reload();
    };

    api.add = function (text) {
      if (!api.user) {
        throw new Error('No user logged in.');
      }

      addComment(api, text);
    };

    api.off = function (type) {
      delete listeners[type];
      return this;
    };

    api.on = function (type, callback) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(callback);
      return this;
    };

    api.init = function () {
      api.initUser();
      api.initComments();
    };

    api.page = function (index) {
      getIssueComments(api);
    };

    api.generateNewCommentURL = function () {
      return getAuthenticationURL(options.endpoints.token);
    };

    api.getHeaders = function () {
      var headers = {};
      headers['Content-Type'] = 'application/json';
      headers.Accept = 'application/vnd.github.v3.html+json';

      if (api.user && api.user.token) {
        headers.Authorization = "token ".concat(api.user.token);
      }

      return headers;
    };

    CONSTANTS.forEach(function (c) {
      return api[c] = c;
    });

    if (options.renderer) {
      var _options$renderer = _toArray(options.renderer),
          r = _options$renderer[0],
          otherArgs = _options$renderer.slice(1);

      r.apply(void 0, [api].concat(_toConsumableArray(otherArgs)));
    }

    return api;
  }

  CONSTANTS.forEach(function (c) {
    return Octomments[c] = c;
  });

  return Octomments;

})));
