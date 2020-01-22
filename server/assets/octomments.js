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
  function getAuthenticationURL(githubClientId) {
    var url = cleanUpURL(window.location.href);
    var params = ["client_id=".concat(githubClientId), "redirect_uri=".concat("".concat(encodeURI(url)))];
    return "https://github.com/login/oauth/authorize?".concat(params.join('&'));
  }

  /* eslint-disable no-restricted-globals */
  var OCTOMMENTS_USER = 'OCTOMMENTS_USER';
  var LS = Storage();

  function Octomments(options) {
    if (!options) throw new Error('Octomments options required.');
    if (!options.endpoints || !options.endpoints.issue || !options.endpoints.token) throw new Error('`options.endpoints` are missing or incomplete.');
    if (!options.id) throw new Error('`options.id` is missing.');
    if (!options.githubClientId) throw new Error('`options.githubClientId` is missing.');
    var listeners = {};
    var api = {
      user: null
    };
    var endpoints = options.endpoints,
        id = options.id,
        githubClientId = options.githubClientId;
    var gotoComments = typeof options.gotoComments !== 'undefined' ? options.gotoComments : true;

    var notify = function notify(type, payload) {
      console.log(type);
      if (listeners[type]) listeners[type].forEach(function (cb) {
        return cb(payload);
      });
    };

    var onError = function onError(type) {
      return function (e, other) {
        return notify(type, e);
      };
    };

    function getUser() {
      notify(Octomments.LOADING_CURRENT_USER);
      var lsUser = LS.getItem(OCTOMMENTS_USER);
      var code = getParameterByName('code');

      var fail = function fail(err) {
        return onError(Octomments.USER_ERROR)(err, getAuthenticationURL(githubClientId));
      };

      if (lsUser) {
        try {
          api.user = JSON.parse(lsUser);
          notify(Octomments.USER_LOADED, api.user);
        } catch (err) {
          console.error(err);
          fail(err);
        }
      } else if (code) {
        fetch("".concat(endpoints.token, "?code=").concat(code)).then(function (response, error) {
          if (error || !response.ok) {
            history.replaceState({}, document.title, cleanUpURL(location.href));
            fail(new Error("Can't get a token"));
          } else {
            response.json().then(function (data) {
              history.replaceState({}, document.title, "".concat(cleanUpURL(location.href)).concat(gotoComments ? '#comments' : ''));
              LS.setItem(OCTOMMENTS_USER, JSON.stringify(data));
              notify(Octomments.USER_LOADED, data);
              api.user = data;
            });
          }
        })["catch"](fail);
      } else {
        notify(Octomments.NO_USER, getAuthenticationURL(githubClientId));
      }
    }

    function extractComments(response, event) {
      var fail = onError(Octomments.COMMENTS_ERROR);
      response.json().then(function (data) {
        if (data.issue.comments) {
          notify(event, data.issue.comments);
        } else {
          fail(new Error('Data is fetched successfully but it is in a wrong format'));
        }
      })["catch"](fail);
    }

    function getIssue() {
      var fail = onError(Octomments.COMMENTS_ERROR);
      notify(Octomments.LOADING_COMMENTS);
      fetch("".concat(endpoints.issue, "?id=").concat(id)).then(function (response, error) {
        if (error) {
          fail(error);
        } else if (!response.ok) {
          if (response.status === 404) {
            suggestIssueCreation(id, endpoints.issue);
            notify(Octomments.NO_GITHUB_ISSUE_CREATED);
          } else {
            fail(new Error("Problem getting issue's data"));
          }
        } else {
          extractComments(response, Octomments.COMMENTS_LOADED);
        }
      })["catch"](fail);
    }

    function addComment(text) {
      var fail = onError(Octomments.NEW_COMMENT_ERROR);
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
            api.user = null;
            LS.removeItem(OCTOMMENTS_USER);
            notify(Octomments.NO_USER);
            return fail(new Error('Not authorized. Log in again.'));
          }

          return fail(new Error('Adding a new comment failed.'));
        }

        extractComments(response, Octomments.COMMENT_SAVED);
      })["catch"](fail);
    }

    api.logout = function () {
      api.user = null;
      LS.removeItem(OCTOMMENTS_USER);
      location.reload();
    };

    api.add = function (text) {
      if (!api.user) {
        throw new Error('No user logged in.');
      }

      notify(Octomments.SAVING_COMMENT);
      addComment(text);
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
      getUser();
      getIssue();
    };

    return api;
  }

  Octomments.LOADING_COMMENTS = 'LOADING_COMMENTS';
  Octomments.COMMENTS_LOADED = 'COMMENTS_LOADED';
  Octomments.NO_GITHUB_ISSUE_CREATED = 'NO_GITHUB_ISSUE_CREATED';
  Octomments.COMMENTS_ERROR = 'COMMENTS_ERROR';
  Octomments.USER_ERROR = 'USER_ERROR';
  Octomments.LOADING_CURRENT_USER = 'LOADING_CURRENT_USER';
  Octomments.NO_USER = 'NO_USER';
  Octomments.USER_LOADED = 'USER_LOADED';
  Octomments.SAVING_COMMENT = 'SAVING_COMMENT';
  Octomments.COMMENT_SAVED = 'COMMENT_SAVED';
  Octomments.NEW_COMMENT_ERROR = 'NEW_COMMENT_ERROR';

  return Octomments;

})));
