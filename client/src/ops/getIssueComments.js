import { COMMENTS_LOADING, COMMENTS_LOADED, USER_NONE } from '../constants';
import { parseLinkHeader, normalizeComment } from '../utils';

export default function getIssueComments(api, p) {
  const { notify, options, error } = api;
  const { endpoints, issueNumber, github } = options;
  const withServer = !!endpoints;
  const commentsError = new Error(
    `Error getting comments for issue #${issueNumber}.`
  );
  const doesntExist = new Error(`Issue #${issueNumber} doesn't exists.`);

  notify(COMMENTS_LOADING);

  function catchErrorHandler(err) {
    console.error(err);
    error(commentsError, 2);
  }
  function processResponse(callback) {
    return (response, err) => {
      if (err) {
        error(commentsError, 2);
      } else if (!response.ok) {
        if (response.status === 404) {
          return error(doesntExist, 1);
        }
        callback(response);
      } else {
        callback(response);
      }
    };
  }

  function getIssueCommentsV4() {
    fetch(
      `${endpoints.issue}?owner=${github.owner}&repo=${github.repo}&number=${issueNumber}`
    )
      .then(
        processResponse(response => {
          if (!response.ok) {
            error(commentsError, 2);
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
      )
      .catch(catchErrorHandler);
  }

  function getIssueCommentsV3(page = 1) {
    const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${issueNumber}/comments?page=${page}`;
    fetch(url, { headers: api.getHeaders() }).then(
      processResponse(response => {
        if (!response.ok) {
          if (response.status === 401) {
            api.logout(false);
            notify(USER_NONE);
            getIssueCommentsV3(page);
            return;
          }
          if (response.status === 403) {
            if (withServer) {
              return getIssueCommentsV4();
            }
            return error(new Error(`Rate limit exceeded.`), 4);
          }
          return error(commentsError, 2);
        }
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
          .catch(catchErrorHandler);
      })
    );
  }

  getIssueCommentsV3(p);
  // getIssueCommentsV4();
}
