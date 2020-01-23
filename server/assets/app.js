/* eslint-disable no-use-before-define */
function $(sel) {
  return document.querySelector(sel);
}
function render(data) {
  $('#comments').innerHTML = data;
}
function renderComments(all, pagination, newComments) {
  const paginationLinks = [];
  if (pagination) {
    if (pagination.first) {
      paginationLinks.push(
        `<a href="javascript:comments.page(${pagination.first.page})">First</a>`
      );
    }
    if (pagination.prev) {
      paginationLinks.push(
        `<a href="javascript:comments.page(${pagination.prev.page})">Previous</a>`
      );
    }
    if (pagination.next) {
      paginationLinks.push(
        `<a href="javascript:comments.page(${pagination.next.page})">Next</a>`
      );
    }
    if (pagination.last) {
      paginationLinks.push(
        `<a href="javascript:comments.page(${pagination.last.page})">Last</a>`
      );
    }
  }
  render(
    all
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
      .join('') + paginationLinks.join('')
  );
}

const comments = Octomments({
  debug: true,
  github: {
    owner: 'krasimir',
    repo: 'ktcom-comments',
  },
  id: 6,
  // github: {
  //   owner: 'krasimir',
  //   repo: 'ktcom-comments',
  // },
  // id: 1,
  // endpoints: {
  //   issue: 'http://localhost:3000/octomments/issue',
  //   token: 'http://localhost:3000/octomments/token',
  // },
});

comments
  .on(Octomments.LOADING_COMMENTS, () => {
    render('<div class="comment">Loading comments ...</div>');
  })
  .on(Octomments.COMMENTS_LOADED, renderComments)
  .on(Octomments.COMMENTS_ERROR, e => {
    render(`<div class="comment">${e}</div>`);
  })
  .on(Octomments.LOADING_USER, () => {
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
