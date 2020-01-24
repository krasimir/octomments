import { COMMENTS_LOADING, COMMENTS_LOADED } from '../constants';
import { parseLinkHeader } from '../utils';

export default function getIssueComments(api) {
  const { notify, options, error } = api;
  const { endpoints, number } = options;
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
          error(commentsError);
        } else if (!response.ok) {
          if (response.status === 404) {
            error(doesntExist);
          } else {
            error(commentsError);
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
              error(new Error(`Error parsing the API response`));
            });
        }
      })
      .catch(err => {
        console.err(err);
        error(commentsError);
      });
  }

  function getIssueCommentsV3(page = 1) {
    // const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${number}/comments?page=${page}`;
    const url = `http://localhost:3000/assets/mock.v3.commentsa.json`;
    fetch(url, {
      headers: { Accept: 'application/vnd.github.v3.html+json' },
    }).then((response, err) => {
      if (err) {
        error(commentsError);
      } else if (!response.ok) {
        if (response.status === 404) {
          return error(doesntExist);
        }
        if (response.status === 403) {
          if (withServer) {
            getIssueCommentsV4();
          } else {
            return error(new Error(`Rate limit exceeded.`));
          }
        }
        return error(commentsError);
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
            error(commentsError);
          });
      }
    });
  }

  getIssueCommentsV3();
}
