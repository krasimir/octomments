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
  function getAuthenticationURL(githubClientId) {
    var params = ["client_id=".concat(githubClientId), "redirect_uri=".concat("".concat(encodeURI(window.location.href), "#comments"))];
    return "https://github.com/login/oauth/authorize?".concat(params.join('&'));
  }

  var OCTOMMENTS_USER = 'OCTOMMENTS_USER';
  var LS = Storage();

  function Octomments(options) {
    if (!options) throw new Error('Octomments options required.');
    if (!options.endpoints || !options.endpoints.issue || !options.endpoints.token) throw new Error('`options.endpoints` are missing or incomplete.');
    if (!options.id) throw new Error('`options.id` is missing.');
    if (!options.githubClientId) throw new Error('`options.githubClientId` is missing.');
    var api = {};
    var endpoints = options.endpoints,
        id = options.id,
        githubClientId = options.githubClientId;

    var notify = options.on || function () {};

    var onCommentsError = function onCommentsError(e) {
      return notify(Octomments.COMMENTS_ERROR, e);
    };

    var onUserError = function onUserError(e) {
      return notify(Octomments.USER_ERROR, e);
    };

    function getIssue() {
      notify(Octomments.LOADING_COMMENTS);
      fetch("".concat(endpoints.issue, "?id=").concat(id)).then(function (response, error) {
        if (error) {
          onCommentsError(error);
        } else if (!response.ok) {
          if (response.status === 404) {
            suggestIssueCreation(id, endpoints.issue);
            notify(Octomments.NO_GITHUB_ISSUE_CREATED);
          } else {
            onCommentsError(new Error("Problem getting issue's data"));
          }
        } else {
          response.json().then(function (data) {
            console.log(JSON.stringify(data, null, 2));

            if (data.issue.comments) {
              notify(Octomments.COMMENTS_LOADED, data.issue.comments);
            } else {
              onCommentsError(new Error('Data is fetched successfully but it is in a wrong format'));
            }
          })["catch"](onCommentsError);
        }
      })["catch"](onCommentsError);
    }

    function getUser() {
      notify(Octomments.LOADING_CURRENT_USER);
      var lsUser = LS.getItem(OCTOMMENTS_USER);
      var code = getParameterByName('code');

      if (code) {
        fetch("".concat(endpoints.token, "?code=").concat(code)).then(function (response, error) {
          if (error || !response.ok) {
            onUserError(getAuthenticationURL(githubClientId));
          } else {
            response.json().then(function (data) {
              LS.setItem(OCTOMMENTS_USER, data);
              notify(Octomments.USER_LOADED, JSON.stringify(data));
            });
          }
        });
      } else if (lsUser) {
        console.log('validate user');
      } else {
        notify(Octomments.NO_CURRENT_USER, getAuthenticationURL(githubClientId));
      }
    }

    getIssue();
    getUser();
    return api;
  }

  Octomments.LOADING_COMMENTS = 'LOADING_COMMENTS';
  Octomments.COMMENTS_LOADED = 'COMMENTS_LOADED';
  Octomments.NO_GITHUB_ISSUE_CREATED = 'NO_GITHUB_ISSUE_CREATED';
  Octomments.COMMENTS_ERROR = 'COMMENTS_ERROR';
  Octomments.USER_ERROR = 'USER_ERROR';
  Octomments.LOADING_CURRENT_USER = 'LOADING_CURRENT_USER';
  Octomments.NO_CURRENT_USER = 'NO_CURRENT_USER';
  Octomments.USER_LOADED = 'USER_LOADED';

  return Octomments;

})));
