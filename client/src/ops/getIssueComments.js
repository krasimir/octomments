import { COMMENTS_LOADING, COMMENTS_LOADED } from '../constants';
import { parseLinkHeader } from '../utils';

export default function getIssueComments(api) {
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
              console.err(err);
              error(new Error(`Error parsing the API response`), 3);
            });
        }
      })
      .catch(err => {
        console.err(err);
        error(commentsError, 2);
      });
  }

  function getIssueCommentsV3(page = 1) {
    const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${number}/comments?page=${page}`;
    // const url = `http://localhost:3000/assets/mock.v3.comments.json`;
    // const url = `http://localhost:3000/assets/mock.v3.no-comments.json`;
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
            const newComments = data.map(item => ({
              id: item.id,
              url: item.html_url,
              author: {
                login: item.user.login,
                avatarUrl: item.user.avatar_url,
                url: item.user.html_url,
              },
              body: item.body_html,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            }));
            api.data = {
              comments: api.data.comments.concat(newComments),
              pagination,
            };
            notify(COMMENTS_LOADED, newComments, pagination);
          })
          .catch(err => {
            console.err(err);
            error(commentsError, 2);
          });
      }
    });
  }

  getIssueCommentsV3();
}
