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
    var api = {};
    var endpoints = options.endpoints,
        id = options.id,
        githubClientId = options.githubClientId;

    var notify = options.on || function () {};

    var gotoComments = typeof options.gotoComments !== 'undefined' ? options.gotoComments : true;

    var onUserError = function onUserError(e) {
      return notify(Octomments.USER_ERROR, e);
    };

    function getUser() {
      notify(Octomments.LOADING_CURRENT_USER);
      var lsUser = LS.getItem(OCTOMMENTS_USER);
      var code = getParameterByName('code');

      if (lsUser) {
        try {
          var user = JSON.parse(lsUser);
          fetch("".concat(endpoints.token, "?validate=").concat(user.token)).then(function (response, error) {
            if (error || !response.ok) {
              LS.removeItem(OCTOMMENTS_USER);
              onUserError(getAuthenticationURL(githubClientId));
            } else {
              notify(Octomments.USER_LOADED, user);
            }
          });
        } catch (err) {
          console.error(err);
          onUserError(getAuthenticationURL(githubClientId));
        }
      } else if (code) {
        fetch("".concat(endpoints.token, "?code=").concat(code)).then(function (response, error) {
          if (error || !response.ok) {
            history.replaceState({}, document.title, cleanUpURL(location.href));
            onUserError(getAuthenticationURL(githubClientId));
          } else {
            response.json().then(function (data) {
              history.replaceState({}, document.title, "".concat(cleanUpURL(location.href)).concat(gotoComments ? '#comments' : ''));
              LS.setItem(OCTOMMENTS_USER, JSON.stringify(data));
              notify(Octomments.USER_LOADED, data);
            });
          }
        });
      } else {
        notify(Octomments.NO_CURRENT_USER, getAuthenticationURL(githubClientId));
      }
    } // getIssue();


    getUser();

    api.logout = function () {
      LS.removeItem(OCTOMMENTS_USER);
      location.reload();
    };

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
