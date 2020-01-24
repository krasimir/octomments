const PREFIX = 'O_';
const GITHUB = (size = 24) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-github"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`;

function $(sel) {
  return document.querySelector(sel);
}
function createEl(type = 'div', cls = '', parent = null, content = null) {
  const el = document.createElement(type);
  el.setAttribute('class', PREFIX + cls);
  if (parent) parent.appendChild(el);
  if (content) el.innerHTML = content;
  return el;
}
function remove(el) {
  el.parentNode.removeChild(el);
}
function formatDate(str) {
  const d = new Date(str);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function OctommentsRenderer(octomments, containerSelector) {
  const $container = $(containerSelector);
  if (!$container) {
    throw new Error('Octomments: invalid container selector.');
  }
  const $root = createEl('div', 'root', $container);
  const $comments = createEl('div', 'comments', $root);
  const $newComment = createEl('div', 'new-comment', $root);
  let $loadingComments;
  let $loadingUser;

  function renderComments(comments, pagination) {
    if ($loadingComments) {
      remove($loadingComments);
      $loadingComments = null;
    }
    if (comments.length === 0) {
      createEl(
        'p',
        'no-comments',
        $comments,
        'No comments yet. Be the first to comment.'
      );
    } else {
      comments.forEach(comment => {
        createEl(
          'div',
          'comment',
          $comments,
          `
            <div class="${PREFIX}comment_left">
              <img src="${comment.author.avatarUrl}" />
            </div>
            <div class="${PREFIX}comment_right">
              <div class="${PREFIX}comment_heading">
                <strong>${comment.author.login}</strong>
                <small> ~ ${formatDate(comment.updatedAt)}</small>
                <a href="${
                  comment.url
                }" target="_blank" class="${PREFIX}right">${GITHUB(16)}</a>
              </div>
              <div class="${PREFIX}comment_body">
                ${comment.body}
              </div>
            </div>
        `
        );
      });
    }
  }
  function renderError(str, parent) {
    return createEl('div', 'error', parent, str);
  }
  function renderUser(user) {
    if ($loadingUser) {
      remove($loadingUser);
      $loadingUser = null;
    }
    createEl(
      'div',
      'comment',
      $newComment,
      `
        <div class="${PREFIX}comment_left">
          <img src="${user.avatarUrl}" />
        </div>
        <div class="${PREFIX}comment_right">
          <textarea id="${PREFIX}_textarea"></textarea>
          <button id="${PREFIX}_submit_comment">Comment</button>
        </div>
    `
    );
    $(`#${PREFIX}_submit_comment`).addEventListener('click', () => {
      const text = $(`#${PREFIX}_textarea`).value;
      if (text !== '') {
        octomments.add(text);
      }
    });
  }

  octomments
    // comments
    .on(octomments.LOADING_COMMENTS, () => {
      $loadingComments = createEl(
        'small',
        'loading',
        $comments,
        'Loading comments ...'
      );
    })
    .on(octomments.COMMENTS_LOADED, renderComments)
    .on(octomments.COMMENTS_ERROR, () => {
      if ($loadingComments) {
        remove($loadingComments);
        $loadingComments = null;
      }
      renderError(
        'There is a problem loading the comments. Please wait a bit and reload the page.',
        $comments
      );
    })
    // user
    .on(octomments.LOADING_USER, () => {
      $loadingUser = createEl(
        'small',
        'loading',
        $newComment,
        'Loading user ...'
      );
    })
    .on(octomments.USER_LOADED, renderUser)
    .on(octomments.SAVING_COMMENT, () => {
      const button = $(`#${PREFIX}_submit_comment`);
      const textarea = $(`#${PREFIX}_textarea`);
      button.disabled = true;
      textarea.disabled = true;
      button.innerHTML = 'Posting your comment ...';
    });

  /*
  octomments
    .on(octomments.LOADING_USER, () => {
      $('#new-comment').innerHTML = `Loading your details ...`;
    })
    .on(octomments.NO_USER, (authURL, githubURL) => {
      $('#new-comment').innerHTML = `
    <a href="${authURL || githubURL}" ${
        authURL ? '' : 'target="_blank"'
      }>Post new comment</a>
    <div id="new-comment-error"></div>
  `;
    })
    .on(octomments.USER_ERROR, (e, authURL) => {
      $('#new-comment').innerHTML = `
    ${e}<br />
    <a href="${authURL}">Log in (via GitHub)</a>
  `;
    })
    .on(octomments.SAVING_COMMENT, () => {
      $('button').disabled = true;
    })
    .on(octomments.COMMENT_SAVED, data => {
      $('button').disabled = false;
      renderComments(data);
    })
    .on(octomments.COMMENT_ERROR, e => {
      $('#new-comment-error').innerHTML = e;
    })
    .init();
  */
}

export default OctommentsRenderer;
