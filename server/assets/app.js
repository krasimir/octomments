function $(sel) {
  return document.querySelector(sel);
}
function render(data) {
  $('#comments').innerHTML = data;
}
function renderComments(data) {
  render(
    data
      .map(
        comment => `
            <div class="comment">
              <p>
                <img src="${comment.author.avatarUrl}" />
                <span>${comment.author.login}</span>
              </p>
              <hr />
              ${comment.body}
            </div>
          `
      )
      .join('')
  );
}

const comments = Octomments({
  endpoints: {
    issue: 'http://localhost:3000/octomments/issue',
    token: 'http://localhost:3000/octomments/token',
  },
  id: 54,
  debug: true,
});

comments
  .on(Octomments.LOADING_COMMENTS, () => {
    render('<div class="comment">Loading comments ...</div>');
  })
  .on(Octomments.COMMENTS_LOADED, renderComments)
  .on(Octomments.COMMENTS_ERROR, e => {
    render(`<div class="comment">Error ${e}</div>`);
  })
  .on(Octomments.LOADING_CURRENT_USER, () => {
    $('#new-comment').innerHTML = `Loading your details ...`;
  })
  .on(Octomments.NO_USER, payload => {
    $('#new-comment').innerHTML = `
      <a href="${payload}">Log in (via GitHub)</a>
      <div id="new-comment-error"></div>
    `;
  })
  .on(Octomments.USER_ERROR, (e, authURL) => {
    $('#new-comment').innerHTML = `
      ${e}<br />
      <a href="${authURL}">Log in (via GitHub)</a>
    `;
  })
  .on(Octomments.USER_LOADED, payload => {
    $('#new-comment').innerHTML = `
      <div>
        ${payload.name}
        <img src="${payload.avatarUrl}" />
        <a href="javascript:comments.logout()">logout</a>
      </div>
      <textarea></textarea>
      <button>comment</button>
      <div id="new-comment-error"></div>
    `;
    $('button').addEventListener('click', () => {
      const text = $('textarea').value;
      $('#new-comment-error').innerHTML = '';

      comments.add(text);
    });
  })
  .on(Octomments.SAVING_COMMENT, () => {
    $('button').disabled = true;
  })
  .on(Octomments.COMMENT_SAVED, data => {
    $('button').disabled = false;
    renderComments(data);
  })
  .on(Octomments.COMMENT_ERROR, e => {
    $('#new-comment-error').innerHTML = e;
  })
  .init();
