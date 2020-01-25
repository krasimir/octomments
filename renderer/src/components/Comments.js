import { PREFIX, GITHUB } from '../constants';
import { createEl, empty, formatDate, $, onClick } from '../utils';

export default function Comments($container, octomments) {
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

  function showError(str) {
    empty($container);
    createEl('div', 'error', $container, `<div>${str}</div>`);
  }

  octomments.on(octomments.ERROR, (e, type) => {
    const {
      options: { number, github },
    } = octomments;
    if (type === 1) {
      showError(
        `Issue <strong>#${number}</strong> doesn't exists at <a href="https://github.com/${github.owner}/${github.repo}/issues" target="_blank">${github.repo} repo</a>.`
      );
    } else if (type === 2 || type === 3 || type === 4) {
      showError(
        `There is a problem fetching the comments. Wait a bit and click <a href="javascript:void(0);" id="${PREFIX}comments_try_again">here</a> to try again.`
      );
      onClick(`#${PREFIX}comments_try_again`, octomments.initComments);
    }
  });

  return api;
}
