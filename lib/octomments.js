import md from 'md.js';
import Storage from './storage';

const OCTOMMENTS_GH_USER = 'OCTOMMENTS_GH_USER';
const OCTOMMENTS_TEXT = 'OCTOMMENTS_TEXT';

const S = Storage();

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
  }
}
function normalizeComment(comment) {
  return {
    author: normalizeUser(comment.user),
    text: md(comment.body),
    url: comment.html_url
  };
}
function Octomments({
  githubClientId,
  getTokenURL,
  owner,
  repo,
  issue,
  onLoggedIn,
  onError
}) {
  if (!githubClientId) throw new Error('Octomments: "githubClientId" is required.');
  if (!getTokenURL) throw new Error('Octomments: "getTokenURL" is required.');
  if (!owner) throw new Error('Octomments: "owner" is required.');
  if (!repo) throw new Error('Octomments: "repo" is required.');
  if (!issue) throw new Error('Octomments: "issue" is required.');
  onError = onError || ((err) => console.error(err));
  onLoggedIn = onLoggedIn || (() => {});

  const endpointIssues = 'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + issue;
  let user = S.getItem(OCTOMMENTS_GH_USER);

  function getAuthenticationURL() {
    const params = [
      'client_id=' + githubClientId,
      'redirect_uri=' + encodeURI(window.location.href)
    ];
    return 'https://github.com/login/oauth/authorize?' + params.join('&');
  }
  function getToken(code, callback) {
    fetch(getTokenURL + '?' + code + '&CID=' + githubClientId)
      .then(r => r.json)
      .then(result => {
        callback(null, result);
      }).catch(error => {
        callback(error);
      })
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
    }).then(r => r.json).then(result => {
      console.log(result);
    }).catch(error => {
      console.error(error);
    })
  }

  const api = {
    onError(callback) {
      onError = callback;
    },
    onLoggedIn(callback) {
      onLoggedIn = callback;
    },
    get() {
      let comments = [];
      return new Promise((done, reject) => {
        fetch(endpointIssues + issue)
          .then(r => r.json())
          .then(issue => {
            comments.push(issue);
            return fetch(issue.comments_url).then(r => r.json())
          })
          .then(data => {
            comments = comments.concat(data);
            done(comments.map(normalizeComment))
          })
          .catch(onError)
      })
    },
    add(text) {
      if (!user) {
        S.setItem(OCTOMMENTS_TEXT, text);
        window.location.href = getAuthenticationURL();
      } else {
        addComment(text);
      }
    },
    login() {
      window.location.href = getAuthenticationURL();
    }
  }

  const code = getParameterByName('code', window.location.href);
  if (code) {
    getToken(code, (error, u) => {
      if (error) {
        onError(error);
      } else {
        user = u;
        S.setItem(OCTOMMENTS_GH_USER, u);
        onLoggedIn(u);
        onError(error);
      }
    });
  }

  if (user) {
    onLoggedIn(user);
  }

  return api;
}

export default Octomments;