import { PREFIX, GITHUB } from '../constants';
import { createEl, empty, formatDate } from '../utils';

export default function Comments($container) {
  const api = {};
  let state = 'idle';

  api.loading = () => {
    state = 'loading';
    empty($container);
    createEl('small', 'loading', $container, 'Loading comments ...');
  };
  api.noComments = () => {
    state = 'idle';
    empty($container);
  };
  api.data = (data, pagination) => {
    if (state === 'loading') {
      state = 'data';
      empty($container);
    }
    data.forEach(comment => {
      createEl(
        'div',
        'comment',
        $container,
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
  };

  return api;
}
