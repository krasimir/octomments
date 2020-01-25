import { createEl, empty } from '../utils';
import { PREFIX } from '../constants';

export default function NewComment($container, octomments) {
  const api = {};

  api.loading = () => {
    empty($container);
    createEl('small', 'loading', $container, 'Loading user ...');
  };
  api.noUser = url => {
    empty($container);
    createEl(
      'div',
      'loading',
      $container,
      `<a href="${url}" class="as-button">✍️ Post a comment</a>`
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
    $(`#${PREFIX}_submit_comment`).addEventListener('click', () => {
      const text = $(`#${PREFIX}_textarea`).value;
      if (text !== '') {
        octomments.add(text);
      }
    });
    $(`#${PREFIX}logout`).addEventListener('click', () => {
      octomments.logout();
    });
  };

  return api;
}
