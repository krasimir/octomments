import { createEl, empty, onClick, $ } from '../utils';
import { PREFIX } from '../constants';

export default function NewComment($container, octomments) {
  const api = {};

  $container.style.display = 'none';

  api.loading = () => {
    empty($container);
    createEl(
      'small',
      'comment',
      $container,
      `
      <div></div>
      <div class="${PREFIX}loading-user"><small>Loading user ...</small></div>
      `
    );
  };
  api.noUser = url => {
    empty($container);
    createEl(
      'div',
      'tar',
      $container,
      `<a href="${url}" class="${PREFIX}as-button">&#x271A; new comment</a>`
    );
  };
  api.form = () => {
    const user = octomments.user;
    if (!user) {
      return api.loading();
    }
    empty($container);
    createEl(
      'div',
      'comment',
      $container,
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
    onClick(`#${PREFIX}_submit_comment`, () => {
      const text = $(`#${PREFIX}_textarea`).value;
      if (text !== '') {
        octomments.add(text);
      }
    });
    onClick(`#${PREFIX}logout`, () => {
      octomments.logout();
    });
  };

  function showError(str, clear = true, parent = $container) {
    if (clear) empty($container);
    return createEl('div', 'error_user', parent, `<div>${str}</div>`);
  }

  octomments.on(octomments.ERROR, (e, type) => {
    if (type === 1) {
      empty($container);
    } else if (type === 5) {
      octomments.logout(false);
      api.noUser(octomments.generateNewCommentURL());
    } else if (type === 6 || type === 7 || type === 10) {
      showError(
        `There is a problem initializing your user. Wait a bit and click <a href="javascript:void(0);" id="${PREFIX}user_try_again">here</a> to try again.`
      );
      onClick(`#${PREFIX}user_try_again`, octomments.initUser);
    } else if (type === 8) {
      const errEl = showError(
        `There is a problem posting your comment. Please try again in a couple of minutes.`,
        false,
        $(`.${PREFIX}comment_right`)
      );
      errEl.style.marginTop = '1em';
    } else if (type === 9) {
      octomments.logout(false);
      showError(
        `Not authorized. Click <a href="javascript:void(0);" id="${PREFIX}user_login">here</a> to login again.`
      );
      onClick(`#${PREFIX}user_login`, octomments.initUser);
    }
  });
  octomments.on(octomments.COMMENTS_LOADED, () => {
    $container.style.display = 'block';
  });

  return api;
}
