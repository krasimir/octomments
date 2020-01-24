(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.OctommentsRenderer = factory());
}(this, (function () { 'use strict';

  var PREFIX = 'O_';

  var GITHUB = function GITHUB() {
    var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 24;
    return "<svg width=\"".concat(size, "\" height=\"").concat(size, "\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-github\"><path d=\"M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22\"></path></svg>");
  };

  function $(sel) {
    return document.querySelector(sel);
  }

  function createEl() {
    var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'div';
    var cls = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var content = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var el = document.createElement(type);
    el.setAttribute('class', PREFIX + cls);
    if (parent) parent.appendChild(el);
    if (content) el.innerHTML = content;
    return el;
  }

  function remove(el) {
    el.parentNode.removeChild(el);
  }

  function formatDate(str) {
    var d = new Date(str);
    return "".concat(d.getDate(), ".").concat(d.getMonth() + 1, ".").concat(d.getFullYear());
  }

  function OctommentsRenderer(octomments, containerSelector) {
    var $container = $(containerSelector);

    if (!$container) {
      throw new Error('Octomments: invalid container selector.');
    }

    var $root = createEl('div', 'root', $container);
    var $commentsContainer = createEl('div', 'comments', $root);
    var $newCommentContainer = createEl('div', 'new-comment', $root);
    var $errorContainer = createEl('div', 'error-container', $root);
    var $comments;
    var $user;
    var $error;

    function renderComments(comments, pagination) {
      if ($comments) {
        remove($comments);
      }

      if (comments === null) {
        $comments = createEl('small', 'loading', $commentsContainer, 'Loading comments ...');
        return;
      }

      comments.forEach(function (comment) {
        createEl('div', 'comment', $commentsContainer, "\n          <div class=\"".concat(PREFIX, "comment_left\">\n            <img src=\"").concat(comment.author.avatarUrl, "\" />\n          </div>\n          <div class=\"").concat(PREFIX, "comment_right\">\n            <div class=\"").concat(PREFIX, "comment_heading\">\n              <strong>").concat(comment.author.login, "</strong>\n              <small> ~ ").concat(formatDate(comment.updatedAt), "</small>\n              <a href=\"").concat(comment.url, "\" target=\"_blank\" class=\"").concat(PREFIX, "right\">").concat(GITHUB(16), "</a>\n            </div>\n            <div class=\"").concat(PREFIX, "comment_body\">\n              ").concat(comment.body, "\n            </div>\n          </div>\n        "));
      });
    }

    function renderUser() {
      var user = octomments.user;

      if ($user) {
        remove($user);
      }

      if (!user) {
        $user = createEl('small', 'loading', $newCommentContainer, 'Loading user ...');
        return;
      }

      $user = createEl('div', 'comment', $newCommentContainer, "\n        <div class=\"".concat(PREFIX, "comment_left\" id=\"").concat(PREFIX, "new_comment\">\n          <img src=\"").concat(user.avatarUrl, "\" />\n        </div>\n        <div class=\"").concat(PREFIX, "comment_right\">\n          <textarea id=\"").concat(PREFIX, "_textarea\" placeholder=\"I think ...\"></textarea>\n          <button id=\"").concat(PREFIX, "_submit_comment\">Comment</button>\n          <a href=\"javascript:void(0);\" id=\"").concat(PREFIX, "logout\" class=\"").concat(PREFIX, "right ").concat(PREFIX, "logout\"><small>Log out</small></a>\n        </div>\n    "));
      $("#".concat(PREFIX, "_submit_comment")).addEventListener('click', function () {
        var text = $("#".concat(PREFIX, "_textarea")).value;

        if (text !== '') {
          octomments.add(text);
        }
      });
      $("#".concat(PREFIX, "logout")).addEventListener('click', function () {
        octomments.logout();
      });
    }

    function renderNoUser(url) {
      if ($user) {
        remove($user);
      }

      $user = createEl('div', 'loading', $newCommentContainer, "<a href=\"".concat(url, "\" class=\"as-button\">\u270D\uFE0F Post a comment</a>"));
    }

    function renderError(e) {
      if ($error) {
        remove($error);
      }

      $error = createEl('div', 'error', $errorContainer, e.message);
    }

    octomments // comments
    .on(octomments.COMMENTS_LOADING, function () {
      return renderComments(null);
    }).on(octomments.COMMENTS_LOADED, renderComments) // user
    .on(octomments.USER_LOADING, function () {
      return renderUser();
    }).on(octomments.USER_NONE, renderNoUser).on(octomments.USER_LOADED, renderUser) // commenting
    .on(octomments.COMMENT_SAVING, function () {
      $("#".concat(PREFIX, "new_comment")).style.opacity = 0.4;
      var button = $("#".concat(PREFIX, "_submit_comment"));
      var textarea = $("#".concat(PREFIX, "_textarea"));
      button.disabled = true;
      textarea.disabled = true;
      button.innerHTML = 'Posting your comment ...';
    }).on(octomments.COMMENT_SAVED, function (newComments) {
      renderUser();
      renderComments(newComments);
    }).on(octomments.ERROR, renderError);
  }

  return OctommentsRenderer;

})));
