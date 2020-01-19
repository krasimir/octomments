(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.Octomments = factory());
}(this, (function () { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var md = createCommonjsModule(function (module, exports) {
	/*!
	 *             __
	 *   __ _  ___/ /
	 *  /  ' \/ _  / 
	 * /_/_/_/\_,_/ 
	 * 
	 * md.js is a lightweight markdown parser
	 * https://github.com/thysultan/md.js
	 * 
	 * @licence MIT
	 */
	(function (factory) {
		{
			module.exports = factory();
		}
	}(function () {
		var unicodes = {
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
			'&': '&amp;',
			'[': '&#91;',
			']': '&#93;',
			'(': '&#40;',
			')': '&#41;',
		};

		var resc = /[<>&\(\)\[\]"']/g;

		function unicode (char) { return unicodes[char] || char; }

		var XSSFilterRegExp = /<(script)[^\0]*?>([^\0]+?)<\/(script)>/gmi;
		var XSSFilterTemplate = '&lt;$1&gt;$2&lt;/$3&gt;';

		var XSSFilterInlineJSRegExp = /(<.*? [^\0]*?=[^\0]*?)(javascript:.*?)(.*>)/gmi;
		var XSSFilterInlineJSTemplate = '$1#$2&#58;$3';

		var XSSFilterImageRegExp = /<img([^\0]*?onerror=)([^\0]*?)>/gmi;
		var XSSFilterImageTemplate = function (match, group1, group2) {
			return '<img' + group1 + group2.replace(resc, unicode) + '>';
		};

		var removeTabsRegExp = /^[\t ]+|[\t ]$/gm;

		var htmlFilterRegExp = /(<.*>[\t ]*\n^.*)/gm;
		var htmlFilterTemplate = function (match, group1) { 
			return group1.replace(/^\n|$\n/gm, '');
		};

		var cssFilterRegExp = /(<style>[^]*<\/style>)/gm;
		var cssFilterTemplate = htmlFilterTemplate;

		var eventsFilterRegExp = /(<[^]+?)(on.*?=.*?)(.*>)/gm;
		var eventsFilterTemplate = '$1$3';

		var blockQuotesRegExp = /^[ \t]*> (.*)/gm;
		var blockQuotesTemplate = '<blockquote>$1</blockquote>';

		var inlineCodeRegExp = /`([^`]+?)`/g;
		var inlineCodeTemplate = function (match, group1) {
			return '<code>'+group1.replace(resc, unicode)+'</code>'
		};

		var blockCodeRegExp = /```(.*)\n([^\0]+?)```(?!```)/gm;

		var imagesRegExp = /!\[(.*)\]\((.*)\)/g;
		var imagesTemplate = function (match, group1, group2) {
			var src = group2.replace(resc, unicode);
			var alt = group1.replace(resc, unicode);

			return '<img src="'+src+'" alt="'+alt+'">';
		};

		var headingsRegExp = /^(#+) +(.*)/gm;
		var headingsTemplate = function (match, hash, content) {
			var length = hash.length; return '<h'+length+'>'+content+'</h'+length+'>';
		};

		var headingsCommonh2RegExp = /^([^\n\t ])(.*)\n----+/gm;
		var headingsCommonh1RegExp = /^([^\n\t ])(.*)\n====+/gm;
		var headingsCommonh1Template = '<h1>$1$2</h1>';
		var headingsCommonh2Template = '<h2>$1$2</h2>';

		var paragraphsRegExp = /^([^-><#\d\+\_\*\t\n\[\! \{])([^]*?)(|  )(?:\n\n)/gm;
		var paragraphsTemplate = function (match, group1, group2, group3) {
			var leadingCharater = group1;
			var body = group2;
			
			var trailingSpace = group3 ? '\n<br>\n' : '\n';
			return '<p>'+leadingCharater+body+'</p>'+trailingSpace;
		};

		var horizontalRegExp = /^.*?(?:---|\*\*\*|- - -|\* \* \*)/gm;
		var horizontalTemplate = '<hr>';

		var strongRegExp = /(?:\*\*|\_\_)([^\*\n_]+?)(?:\*\*|\_\_)/g;
		var strongTemplate = '<strong>$1</strong>';

		var emphasisRegExp = /(?:\*|\_)([^\*\n_]+?)(?:\*|\_)/g;
		var emphasisTemplate = '<em>$1</em>';

		var strikeRegExp = /(?:~~)([^~]+?)(?:~~)/g;
		var strikeTemplate = '<del>$1</del>';

		var linksRegExp = /\[(.*?)\]\(([^\t\n ]*)(?:| "(.*)")\)+/gm;
		var linksTemplate = function (match, group1, group2, group3) {
			var link = group2.replace(resc, unicode);
			var text = group1.replace(resc, unicode);
			var title = group3 ? ' title="'+group3.replace(resc, unicode)+'"' : '';

			return '<a href="'+link+'"'+title+'>'+text+'</a>';
		};

		var listUlRegExp1 = /^[\t ]*?(?:-|\+|\*) (.*)/gm;
		var listUlRegExp2 = /(\<\/ul\>\n(.*)\<ul\>*)+/g;
		var listUlTemplate = '<ul><li>$1</li></ul>';

		var listOlRegExp1 = /^[\t ]*?(?:\d(?:\)|\.)) (.*)/gm;
		var listOlRegExp2 = /(\<\/ol\>\n(.*)\<ol\>*)+/g;
		var listOlTemplate = '<ol><li>$1</li></ol>';

		var lineBreaksRegExp = /^\n\n+/gm;
		var lineBreaksTemplate = '<br>';

		var checkBoxesRegExp = /\[( |x)\]/g;
		var checkBoxesTemplate = function (match, group1) {
			return '<input type="checkbox" disabled' + (group1.toLowerCase() === 'x' ? ' checked' : '') + '>'
		};


		/**
		 * markdown parser
		 * 
		 * @param  {string} markdown
		 * @return {string}
		 */
		function md (markdown) {
			if (!markdown) {
				return '';
			}

			var code = [];
			var index = 0;
			var length = markdown.length;

			// to allow matching trailing paragraphs
			if (markdown[length-1] !== '\n' && markdown[length-2] !== '\n') {
				markdown += '\n\n';
			}

			// format, removes tabs, leading and trailing spaces
			markdown = (
				markdown
					// collect code blocks and replace with placeholder
					// we do this to avoid code blocks matching the paragraph regexp
					.replace(blockCodeRegExp, function (match, lang, block) {
						var placeholder = '{code-block-'+index+'}';
						var regex = new RegExp('{code-block-'+index+'}', 'g');

						code[index++] = {lang: lang, block: block.replace(resc, unicode), regex: regex};

						return placeholder;
					})
					// XSS script tags
					.replace(XSSFilterRegExp, XSSFilterTemplate)
					// XSS image onerror
					.replace(XSSFilterImageRegExp, XSSFilterImageTemplate)
					// filter events
					.replace(eventsFilterRegExp, eventsFilterTemplate)
					// tabs
					.replace(removeTabsRegExp, '')
					// blockquotes
					.replace(blockQuotesRegExp, blockQuotesTemplate)
					// images
					.replace(imagesRegExp, imagesTemplate)
					// headings
					.replace(headingsRegExp, headingsTemplate)
					// headings h1 (commonmark)
					.replace(headingsCommonh1RegExp, headingsCommonh1Template)
					// headings h2 (commonmark)
					.replace(headingsCommonh2RegExp, headingsCommonh2Template)
					// horizontal rule 
					.replace(horizontalRegExp, horizontalTemplate)
					// checkboxes
					.replace(checkBoxesRegExp, checkBoxesTemplate)
					// filter html
					.replace(htmlFilterRegExp, htmlFilterTemplate)
					// filter css
					.replace(cssFilterRegExp, cssFilterTemplate)
					// paragraphs
					.replace(paragraphsRegExp, paragraphsTemplate)
					// inline code
					.replace(inlineCodeRegExp, inlineCodeTemplate)
					// links
					.replace(linksRegExp, linksTemplate)
					// unorderd lists
					.replace(listUlRegExp1, listUlTemplate).replace(listUlRegExp2, '')
					// ordered lists
					.replace(listOlRegExp1, listOlTemplate).replace(listOlRegExp2, '')
					// strong
					.replace(strongRegExp, strongTemplate)
					// emphasis
					.replace(emphasisRegExp, emphasisTemplate)
					// strike through
					.replace(strikeRegExp, strikeTemplate)
					// line breaks
					.replace(lineBreaksRegExp, lineBreaksTemplate)
					// filter inline js
					.replace(XSSFilterInlineJSRegExp, XSSFilterInlineJSTemplate)
			);

			// replace code block placeholders
			for (var i = 0; i < index; i++) {
				var item = code[i];
				var lang = item.lang;
				var block = item.block;

				markdown = markdown.replace(item.regex, function (match) {
					return '<pre><code class="language-'+lang+'">'+block+'</code></pre>';
				});
			}

			return markdown.trim();
		}

		return md;
	}));
	});

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
	  } else {
	    return {
	      setItem: function setItem() {},
	      getITem: function getITem() {}
	    };
	  }
	}

	var OCTOMMENTS_GH_USER = 'OCTOMMENTS_GH_USER';
	var OCTOMMENTS_TEXT = 'OCTOMMENTS_TEXT';
	var S = Storage();

	function getParameterByName(name, url) {
	  if (!url) url = window.location.href;
	  name = name.replace(/[\[\]]/g, '\\$&');
	  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
	      results = regex.exec(url);
	  if (!results) return null;
	  if (!results[2]) return '';
	  return decodeURIComponent(results[2].replace(/\+/g, ' '));
	}

	function normalizeUser(user) {
	  return {
	    name: user.login,
	    avatar: user.avatar_url,
	    url: user.html_url
	  };
	}

	function normalizeComment(comment) {
	  return {
	    author: normalizeUser(comment.user),
	    text: md(comment.body),
	    url: comment.html_url
	  };
	}

	function Octomments(_ref) {
	  var githubClientId = _ref.githubClientId,
	      getTokenURL = _ref.getTokenURL,
	      owner = _ref.owner,
	      repo = _ref.repo,
	      issue = _ref.issue,
	      _onLoggedIn = _ref.onLoggedIn,
	      _onError = _ref.onError;
	  if (!githubClientId) throw new Error('Octomments: "githubClientId" is required.');
	  if (!getTokenURL) throw new Error('Octomments: "getTokenURL" is required.');
	  if (!owner) throw new Error('Octomments: "owner" is required.');
	  if (!repo) throw new Error('Octomments: "repo" is required.');
	  if (!issue) throw new Error('Octomments: "issue" is required.');

	  _onError = _onError || function (err) {
	    return console.error(err);
	  };

	  _onLoggedIn = _onLoggedIn || function () {};

	  var endpointIssues = 'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + issue;
	  var user = S.getItem(OCTOMMENTS_GH_USER);

	  function getAuthenticationURL() {
	    var params = ['client_id=' + githubClientId, 'redirect_uri=' + encodeURI(window.location.href)];
	    return 'https://github.com/login/oauth/authorize?' + params.join('&');
	  }

	  function getToken(code, callback) {
	    fetch(getTokenURL + '?' + code + '&CID=' + githubClientId).then(function (r) {
	      return r.json;
	    }).then(function (result) {
	      callback(null, result);
	    })["catch"](function (error) {
	      callback(error);
	    });
	  }

	  function addComment(text) {
	    fetch(endpointIssues + '/comments', {
	      method: 'POST',
	      body: JSON.stringify({
	        body: text
	      }),
	      headers: {
	        'Authorization': 'token ' + user.token
	      }
	    }).then(function (r) {
	      return r.json;
	    }).then(function (result) {
	      console.log(result);
	    })["catch"](function (error) {
	      console.error(error);
	    });
	  }

	  var api = {
	    onError: function onError(callback) {
	      _onError = callback;
	    },
	    onLoggedIn: function onLoggedIn(callback) {
	      _onLoggedIn = callback;
	    },
	    get: function get() {
	      var comments = [];
	      return new Promise(function (done, reject) {
	        fetch(endpointIssues + issue).then(function (r) {
	          return r.json();
	        }).then(function (issue) {
	          comments.push(issue);
	          return fetch(issue.comments_url).then(function (r) {
	            return r.json();
	          });
	        }).then(function (data) {
	          comments = comments.concat(data);
	          done(comments.map(normalizeComment));
	        })["catch"](_onError);
	      });
	    },
	    add: function add(text) {
	      if (!user) {
	        S.setItem(OCTOMMENTS_TEXT, text);
	        window.location.href = getAuthenticationURL();
	      } else {
	        addComment(text);
	      }
	    },
	    login: function login() {
	      window.location.href = getAuthenticationURL();
	    }
	  };
	  var code = getParameterByName('code', window.location.href);

	  if (code) {
	    getToken(code, function (error, u) {
	      if (error) {
	        _onError(error);
	      } else {
	        user = u;
	        S.setItem(OCTOMMENTS_GH_USER, u);

	        _onLoggedIn(u);

	        _onError(error);
	      }
	    });
	  }

	  if (user) {
	    _onLoggedIn(user);
	  }

	  return api;
	}

	return Octomments;

})));
