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
  function getNewCommentURL(id, github) {
    return "https://github.com/".concat(github.owner, "/").concat(github.repo, "/issues/").concat(id, "#new_comment_field");
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

  var LOADING_COMMENTS = 'LOADING_COMMENTS';
  var COMMENTS_LOADED = 'COMMENTS_LOADED';
  var COMMENTS_ERROR = 'COMMENTS_ERROR';
  var USER_ERROR = 'USER_ERROR';
  var LOADING_USER = 'LOADING_USER';
  var NO_USER = 'NO_USER';
  var USER_LOADED = 'USER_LOADED';
  var SAVING_COMMENT = 'SAVING_COMMENT';
  var COMMENT_SAVED = 'COMMENT_SAVED';
  var COMMENT_ERROR = 'COMMENT_ERROR';
  var OCTOMMENTS_USER = 'OCTOMMENTS_USER';

  /* eslint-disable no-restricted-globals */
  function getUser(api) {
    var _api$options = api.options,
        endpoints = _api$options.endpoints,
        gotoComments = _api$options.gotoComments,
        github = _api$options.github,
        id = _api$options.id;
    gotoComments = typeof gotoComments !== 'undefined' ? gotoComments : true;
    api.notify(LOADING_USER);
    var authURL = endpoints ? getAuthenticationURL(endpoints.token) : null;
    var newCommentURL = github ? getNewCommentURL(id, github) : null;
    var lsUser = api.LS.getItem(OCTOMMENTS_USER);
    var code = getParameterByName('code');

    var fail = function fail(err) {
      return api.notify(USER_ERROR, err, authURL, newCommentURL);
    };

    var clearCurrentURL = function clearCurrentURL() {
      return history.replaceState({}, document.title, "".concat(cleanUpURL(location.href)).concat(gotoComments ? '#comments' : ''));
    };

    if (lsUser) {
      try {
        api.user = JSON.parse(lsUser);
        api.notify(USER_LOADED, api.user);
      } catch (err) {
        console.error(err);
        fail(err);
      }
    } else if (code && endpoints) {
      fetch("".concat(endpoints.token, "?code=").concat(code)).then(function (response, error) {
        if (error || !response.ok) {
          clearCurrentURL();
          fail(new Error("Can't get a token"));
        } else {
          response.json().then(function (data) {
            clearCurrentURL();
            api.LS.setItem(OCTOMMENTS_USER, JSON.stringify(data));
            api.notify(USER_LOADED, data);
            api.user = data;
          })["catch"](fail);
        }
      })["catch"](fail);
    } else {
      api.notify(NO_USER, authURL, newCommentURL);
    }
  }

  function getIssueComments(api) {
    var _api$options = api.options,
        endpoints = _api$options.endpoints,
        id = _api$options.id,
        github = _api$options.github;

    var fail = function fail(e) {
      return api.notify(COMMENTS_ERROR, e);
    };

    var withServer = !!endpoints;
    api.notify(LOADING_COMMENTS);

    function getIssueCommentsV4() {
      fetch("".concat(endpoints.issue, "?id=").concat(id)).then(function (response, error) {
        if (error) {
          fail(error);
        } else if (!response.ok) {
          if (response.status === 404) {
            fail(new Error("GitHub issue doesn't exists"));
          } else {
            fail(new Error("Problem getting issue's data"));
          }
        } else {
          response.json().then(function (data) {
            var newComments = data.issue.comments;
            api.data = {
              comments: api.data.comments.concat(newComments),
              pagination: null
            };
            api.notify(COMMENTS_LOADED, newComments, null);
          })["catch"](fail);
        }
      })["catch"](fail);
    }

    function getIssueCommentsV3() {
      // const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${id}/comments?page=${page}`;
      var url = "http://localhost:3000/assets/mock.v3.comments.json";
      fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3.html+json'
        }
      }).then(function (response, error) {
        if (error) {
          fail(error);
        } else if (!response.ok) {
          if (response.status === 404) {
            return fail(new Error("No issue at https://github.com/".concat(github.owner, "/").concat(github.repo, "/issues with number ").concat(id)));
          }

          if (response.status === 403) {
            if (withServer) {
              getIssueCommentsV4();
            } else {
              return fail(new Error("Rate limit exceeded."));
            }
          }

          return fail(new Error("Can't load comments."));
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
            api.notify(COMMENTS_LOADED, newComments, pagination);
          })["catch"](fail);
        }
      });
    }

    getIssueCommentsV3();
  }

  function addComment(api, text) {
    var fail = function fail(e) {
      return api.notify(COMMENT_ERROR, e);
    };

    var _api$options = api.options,
        endpoints = _api$options.endpoints,
        id = _api$options.id;
    api.notify(SAVING_COMMENT);
    fetch("".concat(endpoints.issue), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comment: true,
        body: text,
        token: api.user.token,
        id: id
      })
    }).then(function (response, error) {
      if (error) {
        return fail(error);
      }

      if (!response.ok) {
        if (response.status === 401) {
          api.logout(false);
          api.notify(NO_USER);
          return fail(new Error('Not authorized. Log in again.'));
        }

        return fail(new Error('Adding a new comment failed.'));
      }

      response.json().then(function (data) {
        if (data.issue.comments) {
          api.notify(COMMENT_SAVED, data.issue.comments);
        } else {
          fail(new Error('Wrong data format'));
        }
      })["catch"](fail);
    })["catch"](fail);
  }

  function Octomments(options) {
    if (!options) throw new Error('Octomments options required.');
    if (!options.github || !options.github.owner || !options.github.repo) throw new Error('`options.github` is missing or incomplete.');
    if (!options.id) throw new Error('`options.id` is missing.');
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

    api.notify = function (type) {
      for (var _len = arguments.length, payload = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        payload[_key - 1] = arguments[_key];
      }

      if (options.debug) console.log(type);
      if (listeners[type]) listeners[type].forEach(function (cb) {
        return cb.apply(void 0, payload);
      });
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
      getUser(api);
      getIssueComments(api);
    };

    api.page = function (index) {
      getIssueComments(api);
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
      var _options$renderer = _toArray(options.renderer),
          r = _options$renderer[0],
          otherArgs = _options$renderer.slice(1);

      r.apply(void 0, [api].concat(_toConsumableArray(otherArgs)));
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

  return Octomments;

})));
