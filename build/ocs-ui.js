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
  function empty(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
  function formatDate(str) {
    var d = new Date(str);
    return "".concat(d.getDate(), ".").concat(d.getMonth() + 1, ".").concat(d.getFullYear());
  }
  function onClick(sel, callback) {
    var el = $(sel);

    if (el) {
      el.addEventListener('click', callback);
    } else {
      console.warn("Octomments: ".concat(sel, " element doesn't exists in the DOM"));
    }
  }

  function Comments($container, octomments) {
    var api = {};
    var $moreCommentsLink;
    var arr = [];

    api.loading = function () {
      if (arr.length === 0) {
        empty($container);
        createEl('div', 'summary', $container, "\n      <div>Loading comments ...</div>\n        <div>\n          <a href=\"https://octomments.now.sh/\" target=\"_blank\">\n            ".concat(GITHUB(14), "\n          </a>\n        </div>"));
      } else {
        $moreCommentsLink.innerHTML = "\n        <div></div>\n        <div class=\"".concat(PREFIX, "more-comments-loading\"><small>loading ...</small></div>\n      ");
      }
    };

    api.noComments = function () {
      empty($container);
    };

    api.newComment = function (newComments) {
      api.data(newComments);
    };

    api.data = function (data, pagination) {
      arr = arr.concat(data);
      empty($container);
      createEl('div', 'summary', $container, "\n        <div id=\"".concat(PREFIX, "num-of-comments\">").concat(arr.length, " comment").concat(arr.length !== 1 ? 's' : '', "</div>\n        <div>\n          <a href=\"https://octomments.now.sh/\" target=\"_blank\">\n            ").concat(GITHUB(14), "\n          </a>\n        </div>\n      "));
      arr.forEach(function (comment) {
        createEl('div', 'comment', $container, "\n          <div class=\"".concat(PREFIX, "comment_left\">\n            <img src=\"").concat(comment.author.avatarUrl, "\" />\n          </div>\n          <div class=\"").concat(PREFIX, "comment_right\">\n            <div class=\"").concat(PREFIX, "comment_heading\">\n              <strong>").concat(comment.author.login, "</strong>\n              <small> ~ ").concat(formatDate(comment.updatedAt), "</small>\n              <a href=\"").concat(comment.url, "\" target=\"_blank\" class=\"").concat(PREFIX, "right\">").concat(GITHUB(16), "</a>\n            </div>\n            <div class=\"").concat(PREFIX, "comment_body\">\n              ").concat(comment.body, "\n            </div>\n          </div>\n        "));
      });

      if (pagination && pagination.next) {
        $moreCommentsLink = createEl('div', "comment ".concat(PREFIX, "more-comments"), $container, "\n          <div></div>\n          <div>\n            <a href=\"javascript:void(0);\" id=\"".concat(PREFIX, "more-comments-link\">\n              <small>... load more comments</small>\n            </a>\n          </div>\n        "));
        onClick("#".concat(PREFIX, "more-comments-link"), function () {
          octomments.page(pagination.next.page);
        });
      }
    };

    function showError(str) {
      empty($container);
      createEl('div', 'error', $container, "<div>".concat(str, "</div>"));
    }

    octomments.on(octomments.ERROR, function (e, type) {
      var _octomments$options = octomments.options,
          number = _octomments$options.number,
          github = _octomments$options.github;

      if (type === 1) {
        showError("Issue <strong>#".concat(number, "</strong> doesn't exists at <a href=\"https://github.com/").concat(github.owner, "/").concat(github.repo, "/issues\" target=\"_blank\">").concat(github.repo, " repo</a>."));
      } else if (type === 2 || type === 3 || type === 4) {
        showError("There is a problem fetching the comments. Wait a bit and click <a href=\"javascript:void(0);\" id=\"".concat(PREFIX, "comments_try_again\">here</a> to try again."));
        onClick("#".concat(PREFIX, "comments_try_again"), octomments.initComments);
      }
    });
    return api;
  }

  function NewComment($container, octomments) {
    var api = {};
    $container.style.display = 'none';

    api.loading = function () {
      empty($container);
      createEl('small', 'comment', $container, "\n      <div></div>\n      <div class=\"".concat(PREFIX, "loading-user\"><small>Loading user ...</small></div>\n      "));
    };

    api.noUser = function (url) {
      empty($container);
      createEl('div', 'tar', $container, "<a href=\"".concat(url, "\" class=\"").concat(PREFIX, "as-button\">&#x271A; new comment</a>"));
    };

    api.form = function () {
      var user = octomments.user;

      if (!user) {
        return api.loading();
      }

      empty($container);
      createEl('div', 'comment', $container, "\n        <div class=\"".concat(PREFIX, "comment_left\" id=\"").concat(PREFIX, "new_comment\">\n          <img src=\"").concat(user.avatarUrl, "\" />\n        </div>\n        <div class=\"").concat(PREFIX, "comment_right\">\n          <textarea id=\"").concat(PREFIX, "_textarea\" placeholder=\"I think ...\"></textarea>\n          <button id=\"").concat(PREFIX, "_submit_comment\">Comment</button>\n          <a href=\"javascript:void(0);\" id=\"").concat(PREFIX, "logout\" class=\"").concat(PREFIX, "right ").concat(PREFIX, "logout\"><small>Log out</small></a>\n        </div>\n    "));
      onClick("#".concat(PREFIX, "_submit_comment"), function () {
        var text = $("#".concat(PREFIX, "_textarea")).value;

        if (text !== '') {
          octomments.add(text);
        }
      });
      onClick("#".concat(PREFIX, "logout"), function () {
        octomments.logout();
      });
    };

    function showError(str) {
      var clear = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : $container;
      if (clear) empty($container);
      return createEl('div', 'error_user', parent, "<div>".concat(str, "</div>"));
    }

    octomments.on(octomments.ERROR, function (e, type) {
      if (type === 1) {
        empty($container);
      } else if (type === 5) {
        octomments.logout(false);
        api.noUser(octomments.generateNewCommentURL());
      } else if (type === 6 || type === 7 || type === 10) {
        showError("There is a problem initializing your user. Wait a bit and click <a href=\"javascript:void(0);\" id=\"".concat(PREFIX, "user_try_again\">here</a> to try again."));
        onClick("#".concat(PREFIX, "user_try_again"), octomments.initUser);
      } else if (type === 8) {
        var errEl = showError("There is a problem posting your comment. Please try again in a couple of minutes.", false, $(".".concat(PREFIX, "comment_right")));
        errEl.style.marginTop = '1em';
      } else if (type === 9) {
        octomments.logout(false);
        showError("Not authorized. Click <a href=\"javascript:void(0);\" id=\"".concat(PREFIX, "user_login\">here</a> to login again."));
        onClick("#".concat(PREFIX, "user_login"), octomments.initUser);
      }
    });
    octomments.on(octomments.COMMENTS_LOADED, function () {
      $container.style.display = 'block';
    });
    return api;
  }

  function OctommentsRenderer(octomments, containerSelector) {
    var $container = $(containerSelector);

    if (!$container) {
      throw new Error('Octomments: invalid container selector.');
    }

    var $root = createEl('div', 'root', $container);
    var comments = Comments(createEl('div', 'comments', $root), octomments);
    var newComment = NewComment(createEl('div', 'new-comment', $root), octomments);
    octomments // comments
    .on(octomments.COMMENTS_LOADING, comments.loading).on(octomments.COMMENTS_LOADED, comments.data) // user
    .on(octomments.USER_LOADING, newComment.loading).on(octomments.USER_NONE, newComment.noUser).on(octomments.USER_LOADED, newComment.form) // commenting
    .on(octomments.COMMENT_SAVING, function () {
      $("#".concat(PREFIX, "new_comment")).style.opacity = 0.4;
      var button = $("#".concat(PREFIX, "_submit_comment"));
      var textarea = $("#".concat(PREFIX, "_textarea"));
      button.disabled = true;
      textarea.disabled = true;
      button.innerHTML = 'Posting your comment ...';
    }).on(octomments.COMMENT_SAVED, function (newComments) {
      newComment.form();
      comments.newComment(newComments);
    });
  }

  return OctommentsRenderer;

})));
