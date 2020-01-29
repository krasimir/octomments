import { COMMENTS_LOADING, COMMENTS_LOADED } from '../constants';
import { parseLinkHeader, normalizeComment } from '../utils';

export default function getIssueComments(api, p) {
  const { notify, options, error } = api;
  const { endpoints, number, github } = options;
  const withServer = !!endpoints;
  const commentsError = new Error(
    `Error getting comments for issue #${number}.`
  );
  const doesntExist = new Error(`Issue #${number} doesn't exists.`);

  notify(COMMENTS_LOADING);

  function getIssueCommentsV4() {
    fetch(`${endpoints.issue}?number=${number}`)
      .then((response, err) => {
        if (err) {
          error(commentsError, 2);
        } else if (!response.ok) {
          if (response.status === 404) {
            error(doesntExist, 1);
          } else {
            error(commentsError, 2);
          }
        } else {
          response
            .json()
            .then(data => {
              const newComments = data.issue.comments;
              api.data = {
                comments: api.data.comments.concat(newComments),
                pagination: null,
              };
              notify(COMMENTS_LOADED, newComments, null);
            })
            .catch(err => {
              console.error(err);
              error(new Error(`Error parsing the API response`), 3);
            });
        }
      })
      .catch(err => {
        console.error(err);
        error(commentsError, 2);
      });
  }

  function getIssueCommentsV3(page = 1) {
    const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${number}/comments?page=${page}`;
    fetch(url, {
      headers: { Accept: 'application/vnd.github.v3.html+json' },
    }).then((response, err) => {
      if (err) {
        error(commentsError, 2);
      } else if (!response.ok) {
        if (response.status === 404) {
          return error(doesntExist, 1);
        }
        if (response.status === 403) {
          if (withServer) {
            return getIssueCommentsV4();
          }
          return error(new Error(`Rate limit exceeded.`), 4);
        }
        return error(commentsError, 2);
      } else {
        const link = response.headers.get('Link');
        let pagination = null;
        if (link) {
          pagination = parseLinkHeader(link);
        }
        response
          .json()
          .then(data => {
            const newComments = data.map(normalizeComment);
            api.data = {
              comments: api.data.comments.concat(newComments),
              pagination,
            };
            notify(COMMENTS_LOADED, newComments, pagination);
          })
          .catch(err => {
            console.error(err);
            error(commentsError, 2);
          });
      }
    });
  }

  getIssueCommentsV3(p);
}
