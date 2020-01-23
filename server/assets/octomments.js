(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Octomments = factory());
}(this, (function () { 'use strict';

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

  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp("[?&]".concat(name, "(=([^&#]*)|&|#|$)"));
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
  function suggestIssueCreation(id, endpoint) {
    console.log("Octomments: Here is a curl request to create the missing GitHub Issue. Make sure that you feel the empty fields:\n\ncurl --location --request POST '".concat(endpoint, "' --header 'Content-Type: application/json' --data-raw '{\"id\": \"").concat(id, "\", \"title\": \"\", \"text\": \"\", \"secret\": \"\"}'\n\n"));
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

  var LOADING_COMMENTS = 'LOADING_COMMENTS';
  var COMMENTS_LOADED = 'COMMENTS_LOADED';
  var COMMENTS_ERROR = 'COMMENTS_ERROR';
  var USER_ERROR = 'USER_ERROR';
  var LOADING_CURRENT_USER = 'LOADING_CURRENT_USER';
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
        gotoComments = _api$options.gotoComments;
    gotoComments = typeof gotoComments !== 'undefined' ? gotoComments : true;
    api.notify(LOADING_CURRENT_USER);
    var lsUser = api.LS.getItem(OCTOMMENTS_USER);
    var code = getParameterByName('code');

    var fail = function fail(err) {
      return api.notify(USER_ERROR, err, getAuthenticationURL(endpoints.token));
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
    } else if (code) {
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
      api.notify(NO_USER, getAuthenticationURL(endpoints.token));
    }
  }

  function getIssue(api) {
    var _api$options = api.options,
        endpoints = _api$options.endpoints,
        id = _api$options.id;

    var fail = function fail(e) {
      return api.notify(COMMENTS_ERROR, e);
    };

    api.notify(LOADING_COMMENTS);
    fetch("".concat(endpoints.issue, "?id=").concat(id)).then(function (response, error) {
      if (error) {
        fail(error);
      } else if (!response.ok) {
        if (response.status === 404) {
          suggestIssueCreation(id, endpoints.issue);
          fail(new Error("GitHub issue doesn't exists"));
        } else {
          fail(new Error("Problem getting issue's data"));
        }
      } else {
        response.json().then(function (data) {
          if (data.issue.comments) {
            api.notify(COMMENTS_LOADED, data.issue.comments);
          } else {
            fail(new Error('Wrong data format'));
          }
        })["catch"](fail);
      }
    })["catch"](fail);
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

  /* eslint-disable no-restricted-globals */

  function Octomments(options) {
    if (!options) throw new Error('Octomments options required.');
    if (!options.endpoints || !options.endpoints.issue || !options.endpoints.token) throw new Error('`options.endpoints` are missing or incomplete.');
    if (!options.id) throw new Error('`options.id` is missing.');
    var listeners = {};
    var api = {
      user: null,
      options: options,
      LS: Storage()
    };
    var debug = typeof options.debug !== 'undefined' ? options.debug : false;

    api.notify = function (type, payload) {
      if (debug) console.log(type);
      if (listeners[type]) listeners[type].forEach(function (cb) {
        return cb(payload);
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

  return Octomments;

})));
