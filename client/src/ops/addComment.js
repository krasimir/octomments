import {
  SAVING_COMMENT,
  COMMENT_ERROR,
  NO_USER,
  COMMENT_SAVED,
} from '../constants';

export default function addComment(api, text) {
  const fail = e => api.notify(COMMENT_ERROR, e);
  const { endpoints, id } = api.options;

  api.notify(SAVING_COMMENT);
  fetch(`${endpoints.issue}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: true,
      body: text,
      token: api.user.token,
      id,
    }),
  })
    .then((response, error) => {
      if (error) {
        return fail(error);
      }
      if (!response.ok) {
        if (response.status === 401) {
          api.logout(false);
          api.notify(NO_USER);
          return fail(new Error('Not authorized. Log in again.'));
        }
        return fail(new Error('Adding a new comment failed.'));
      }
      response
        .json()
        .then(data => {
          if (data.issue.comments) {
            api.notify(COMMENT_SAVED, data.issue.comments);
          } else {
            fail(new Error('Wrong data format'));
          }
        })
        .catch(fail);
    })
    .catch(fail);
}
