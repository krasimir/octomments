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
  const $commentsContainer = createEl('div', 'comments', $root);
  const $newCommentContainer = createEl('div', 'new-comment', $root);
  const $errorContainer = createEl('div', 'error-container', $root);
  let $comments;
  let $user;
  let $error;

  function renderComments(comments, pagination) {
    if ($comments) {
      remove($comments);
    }
    if (comments === null) {
      $comments = createEl(
        'small',
        'loading',
        $commentsContainer,
        'Loading comments ...'
      );
      return;
    }
    comments.forEach(comment => {
      createEl(
        'div',
        'comment',
        $commentsContainer,
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
  function renderUser() {
    const user = octomments.user;
    if ($user) {
      remove($user);
    }
    if (!user) {
      $user = createEl(
        'small',
        'loading',
        $newCommentContainer,
        'Loading user ...'
      );
      return;
    }
    $user = createEl(
      'div',
      'comment',
      $newCommentContainer,
      `
        <div class="${PREFIX}comment_left" id="${PREFIX}new_comment">
          <img src="${user.avatarUrl}" />
        </div>
        <div class="${PREFIX}comment_right">
          <textarea id="${PREFIX}_textarea" placeholder="I think ..."></textarea>
          <button id="${PREFIX}_submit_comment">Comment</button>
          <a href="javascript:void(0);" id="${PREFIX}logout" class="${PREFIX}right ${PREFIX}logout"><small>Log out</small></a>
        </div>
    `
    );
    $(`#${PREFIX}_submit_comment`).addEventListener('click', () => {
      const text = $(`#${PREFIX}_textarea`).value;
      if (text !== '') {
        octomments.add(text);
      }
    });
    $(`#${PREFIX}logout`).addEventListener('click', () => {
      octomments.logout();
    });
  }
  function renderNoUser(url) {
    if ($user) {
      remove($user);
    }
    $user = createEl(
      'div',
      'loading',
      $newCommentContainer,
      `<a href="${url}" class="as-button">✍️ Post a comment</a>`
    );
  }
  function renderError(e) {
    if ($error) {
      remove($error);
    }
    $error = createEl('div', 'error', $errorContainer, e.message);
  }

  octomments
    // comments
    .on(octomments.COMMENTS_LOADING, () => renderComments(null))
    .on(octomments.COMMENTS_LOADED, renderComments)
    // user
    .on(octomments.USER_LOADING, () => renderUser(null))
    .on(octomments.USER_NONE, renderNoUser)
    .on(octomments.USER_LOADED, renderUser)
    // commenting
    .on(octomments.COMMENT_SAVING, () => {
      $(`#${PREFIX}new_comment`).style.opacity = 0.4;
      const button = $(`#${PREFIX}_submit_comment`);
      const textarea = $(`#${PREFIX}_textarea`);
      button.disabled = true;
      textarea.disabled = true;
      button.innerHTML = 'Posting your comment ...';
    })
    .on(octomments.COMMENT_SAVED, newComments => {
      renderUser();
      renderComments(newComments);
    })
    .on(octomments.ERROR, renderError);
}

export default OctommentsRenderer;
