import { PREFIX, GITHUB } from '../constants';
import { createEl, empty, formatDate, onClick } from '../utils';

export default function Comments($container, octomments) {
  const api = {};
  const { number, github } = octomments.options;
  const { owner, repo } = github;
  const repoURL = `https://github.com/${owner}/${repo}/issues/${number}`;
  let $moreCommentsLink;
  let arr = [];

  api.loading = () => {
    if (arr.length === 0) {
      empty($container);
      createEl(
        'div',
        'summary',
        $container,
        `
      <div>Loading comments ...</div>
        <div>
          <a href="${repoURL}" target="_blank">
            ${GITHUB(14)}
          </a>
        </div>`
      );
    } else {
      $moreCommentsLink.innerHTML = `
        <div></div>
        <div class="${PREFIX}more-comments-loading"><small>loading ...</small></div>
      `;
    }
  };
  api.noComments = () => {
    empty($container);
  };
  api.newComment = newComments => {
    api.data(newComments);
  };
  api.data = (data, pagination) => {
    arr = arr.concat(data);
    empty($container);
    createEl(
      'div',
      'summary',
      $container,
      `
        <div id="${PREFIX}num-of-comments">${arr.length} comment${
        arr.length !== 1 ? 's' : ''
      }</div>
        <div>
          <a href="${repoURL}" target="_blank">
            ${GITHUB(14)}
          </a>
        </div>
      `
    );
    arr.forEach(comment => {
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
    if (pagination && pagination.next) {
      $moreCommentsLink = createEl(
        'div',
        `comment ${PREFIX}more-comments`,
        $container,
        `
          <div></div>
          <div>
            <a href="javascript:void(0);" id="${PREFIX}more-comments-link">
              <small>... load more comments</small>
            </a>
          </div>
        `
      );
      onClick(`#${PREFIX}more-comments-link`, () => {
        octomments.page(pagination.next.page);
      });
    }
  };

  function showError(str) {
    empty($container);
    createEl('div', 'error', $container, `<div>${str}</div>`);
  }

  octomments.on(octomments.ERROR, (e, type) => {
    console.log('-errror', e, type);
    if (type === 1) {
      showError(
        `Issue <strong>#${number}</strong> doesn't exists at <a href="https://github.com/${owner}/${repo}/issues" target="_blank">${repo} repo</a>.`
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
