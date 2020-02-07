import { COMMENT_SAVING, USER_NONE, COMMENT_SAVED } from '../constants';
import { normalizeComment } from '../utils';

export default function addComment(api, text) {
  const { notify, error, options } = api;
  const { issueNumber, github } = options;
  const failed = new Error('Adding a new comment failed.');

  notify(COMMENT_SAVING);

  const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${issueNumber}/comments`;

  function catchErrorHandler(err) {
    console.error(err);
    error(failed, 10);
  }
  function processResponse(callback) {
    return (response, err) => {
      if (err) {
        return error(failed, 8);
      }
      if (!response.ok) {
        if (response.status === 401) {
          api.logout(false);
          notify(USER_NONE);
          return error(new Error('Not authorized. Log in again.'), 9);
        }
        if (response.status === 403) {
          return error(new Error('Rate limit exceeded.'), 4);
        }
        return error(failed, 8);
      }
      response
        .json()
        .then(data => {
          if (data) {
            callback(data);
          } else {
            error(new Error('Parsing new-comment response failed.'), 10);
          }
        })
        .catch(catchErrorHandler);
    };
  }

  fetch(url, {
    method: 'POST',
    headers: api.getHeaders(),
    body: JSON.stringify({ body: text }),
  })
    .then(
      processResponse(item => {
        notify(COMMENT_SAVED, [normalizeComment(item)]);
      })
    )
    .catch(catchErrorHandler);
}
