import { PREFIX } from './constants';
import { createEl, $ } from './utils';
import Comments from './components/Comments';
import NewComment from './components/NewComment';

function OctommentsRenderer(octomments, containerSelector) {
  const $container = $(containerSelector);
  if (!$container) {
    throw new Error('Octomments: invalid container selector.');
  }
  const $root = createEl('div', 'root', $container);
  const comments = Comments(createEl('div', 'comments', $root), octomments);
  const newComment = NewComment(
    createEl('div', 'new-comment', $root),
    octomments
  );

  octomments
    // comments
    .on(octomments.COMMENTS_LOADING, comments.loading)
    .on(octomments.COMMENTS_LOADED, comments.data)
    // user
    .on(octomments.USER_LOADING, newComment.loading)
    .on(octomments.USER_NONE, newComment.noUser)
    .on(octomments.USER_LOADED, newComment.form)
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
      newComment.newCommentSaved();
      newComment.form();
      comments.newComment(newComments);
    });
}

export default OctommentsRenderer;
