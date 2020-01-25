import { COMMENT_SAVING, USER_NONE, COMMENT_SAVED } from '../constants';

export default function addComment(api, text) {
  const { notify, error, options } = api;
  const { endpoints, number } = options;
  const failed = new Error('Adding a new comment failed.');

  notify(COMMENT_SAVING);

  fetch(`${endpoints.issue}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: true,
      body: text,
      token: api.user.token,
      number,
    }),
  })
    .then((response, err) => {
      if (err) {
        return error(failed, 8);
      }
      if (!response.ok) {
        if (response.status === 401) {
          api.logout(false);
          notify(USER_NONE);
          return error(new Error('Not authorized. Log in again.'), 9);
        }
        return error(failed, 8);
      }
      response
        .json()
        .then(data => {
          if (data.issue.comments) {
            notify(COMMENT_SAVED, data.issue.comments);
          } else {
            error(new Error('Parsing new-comment response failed.'), 10);
          }
        })
        .catch(err => {
          console.error(err);
          error(failed, 10);
        });
    })
    .catch(err => {
      console.error(err);
      error(failed, 8);
    });
}
