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
    ['code', 'error', 'error_description', 'error_uri'].forEach(function (a) {
      url = url.replace(new RegExp("[?&]".concat(a, "=[^&]+")), '');
    });
    return url;
  }
  function getAuthenticationURL(tokenURL) {
    var url = cleanUpURL(window.location.href);
    return "".concat(tokenURL, "?redirect_url=").concat(encodeURI(url));
  }
  function getNewCommentURL(number, github) {
    return "https://github.com/".concat(github.owner, "/").concat(github.repo, "/issues/").concat(number, "#new_comment_field");
  }
  function parseLinkHeader(link) {
    var entries = link.split(',');
    var links = {};

    for (var i in entries) {
      var entry = entries[i];
      var l = {};
      l.name = entry.match(/rel=\"([^\"]*)/)[1];
      l.url = entry.match(/<([^>]*)/)[1];
      l.page = parseInt(entry.match(/page=(\d+).*$/)[1], 10);
      links[l.name] = l;
    }

    return links;
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
    var endpoints = options.endpoints,
        gotoComments = options.gotoComments;
    gotoComments = typeof gotoComments !== 'undefined' ? gotoComments : true;
    notify(USER_LOADING);
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
    } else if (endpoints && getParameterByName('code')) {
      fetch("".concat(endpoints.token, "?code=").concat(getParameterByName('code'))).then(function (response, err) {
        if (err || !response.ok) {
          if (err) console.error(err);
          clearCurrentURL();
          error(new Error('Problem getting access token.'), 6);
        } else {
          response.json().then(function (data) {
            clearCurrentURL();
            api.LS.setItem(OCTOMMENTS_USER, JSON.stringify(data));
            api.user = data;
            notify(USER_LOADED, data);
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
    var withServer = !!endpoints;
    var commentsError = new Error("Error getting comments for issue #".concat(number, "."));
    var doesntExist = new Error("Issue #".concat(number, " doesn't exists."));
    notify(COMMENTS_LOADING);

    function getIssueCommentsV4() {
      fetch("".concat(endpoints.issue, "?number=").concat(number)).then(function (response, err) {
        if (err) {
          error(commentsError, 2);
        } else if (!response.ok) {
          if (response.status === 404) {
            error(doesntExist, 1);
          } else {
            error(commentsError, 2);
          }
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
      })["catch"](function (err) {
        console.error(err);
        error(commentsError, 2);
      });
    }

    function getIssueCommentsV3() {
      var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var url = "https://api.github.com/repos/".concat(github.owner, "/").concat(github.repo, "/issues/").concat(number, "/comments?page=").concat(page); // const url = `http://localhost:3000/assets/mock.v3.comments.json`;
      // const url = `http://localhost:3000/assets/mock.v3.no-comments.json`;

      fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3.html+json'
        }
      }).then(function (response, err) {
        if (err) {
          error(commentsError, 2);
        } else if (!response.ok) {
          if (response.status === 404) {
            return error(doesntExist, 1);
          }

          if (response.status === 403) {
            if (withServer) {
              return getIssueCommentsV4();
            }

            return error(new Error("Rate limit exceeded."), 4);
          }

          return error(commentsError, 2);
        } else {
          var link = response.headers.get('Link');
          var pagination = null;

          if (link) {
            pagination = parseLinkHeader(link);
          }

          response.json().then(function (data) {
            var newComments = data.map(function (item) {
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
            });
            api.data = {
              comments: api.data.comments.concat(newComments),
              pagination: pagination
            };
            notify(COMMENTS_LOADED, newComments, pagination);
          })["catch"](function (err) {
            console.error(err);
            error(commentsError, 2);
          });
        }
      });
    }

    getIssueCommentsV3(p);
  }

  function addComment(api, text) {
    var notify = api.notify,
        error = api.error,
        options = api.options;
    var endpoints = options.endpoints,
        number = options.number;
    var failed = new Error('Adding a new comment failed.');
    notify(COMMENT_SAVING);
    fetch("".concat(endpoints.issue), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comment: true,
        body: text,
        token: api.user.token,
        number: number
      })
    }).then(function (response, err) {
      if (err) {
        return error(failed, 8);
      }

      if (!response.ok) {
        if (response.status === 401) {
          api.logout(false);
          notify(USER_NONE);
          return error(new Error('Not authorized. Log in again.'), 9);
        }

        return error(failed, 8);
      }

      response.json().then(function (data) {
        if (data.issue.comments) {
          notify(COMMENT_SAVED, data.issue.comments);
        } else {
          error(new Error('Parsing new-comment response failed.'), 10);
        }
      })["catch"](function (err) {
        console.error(err);
        error(failed, 10);
      });
    })["catch"](function (err) {
      console.error(err);
      error(failed, 8);
    });
  }

  function Octomments(options) {
    if (!options) throw new Error('Octomments options required.');
    if (!options.github || !options.github.owner || !options.github.repo) throw new Error('`options.github` is missing or incomplete.');
    if (!options.number) throw new Error('`options.number` is missing.');
    var listeners = {};
    var api = {
      user: null,
      data: {
        comments: [],
        pagination: null
      },
      options: options,
      LS: Storage()
    }; // internal

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
    }; // public


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
      getIssueComments(api, index);
    };

    api.generateNewCommentURL = function () {
      return options.endpoints ? getAuthenticationURL(options.endpoints.token) : options.github ? getNewCommentURL(options.number, options.github) : null;
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
