import { createEl, empty, onClick, $, onChange } from '../utils';
import { PREFIX } from '../constants';

const TEXT = 'OCTOMMENTS_NEW_COMMENT_TEXT';

export default function NewComment($container, octomments) {
  const api = {};

  $container.style.display = 'none';

  function setupForm(onSubmit) {
    const initialValue = octomments.LS.getItem(TEXT) || '';
    const button = $(`#${PREFIX}_submit_comment`);
    const textarea = $(`#${PREFIX}_textarea`);

    onClick(`#${PREFIX}_submit_comment`, () => {
      button.disabled = true;
      onSubmit(textarea.value);
    });
    onChange(`#${PREFIX}_textarea`, e => {
      if (e.target.value === '') {
        button.disabled = true;
      } else {
        button.disabled = false;
      }
      octomments.LS.setItem(TEXT, e.target.value);
    });
    if (initialValue === '') {
      button.disabled = true;
    } else {
      textarea.value = initialValue;
    }
  }

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
      'comment',
      $container,
      `
        <div class="${PREFIX}comment_left" id="${PREFIX}new_comment">
          <div class="${PREFIX}avatar_placeholder"></div>
        </div>
        <div class="${PREFIX}comment_right">
          <textarea id="${PREFIX}_textarea" placeholder="I think ..."></textarea>
          <button id="${PREFIX}_submit_comment">Log in and comment</button>
        </div>
      `
    );
    setupForm(() => {
      window.location.href = url;
    });
  };
  api.form = (_, focusTextArea) => {
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
    setupForm(text => {
      octomments.add(text);
    });
    onClick(`#${PREFIX}logout`, () => {
      octomments.logout();
    });
    if (focusTextArea) {
      setTimeout(() => {
        $(`#${PREFIX}_textarea`).focus();
      }, 100);
    }
  };
  api.newCommentSaved = () => {
    octomments.LS.removeItem(TEXT);
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
