import {
  COMMENTS_ERROR,
  LOADING_COMMENTS,
  COMMENTS_LOADED,
} from '../constants';
import { parseLinkHeader } from '../utils';

export default function getIssueComments(api) {
  const { endpoints, id, github } = api.options;
  const fail = e => api.notify(COMMENTS_ERROR, e);
  const withServer = !!endpoints;

  api.notify(LOADING_COMMENTS);

  function getIssueCommentsV4() {
    fetch(`${endpoints.issue}?id=${id}`)
      .then((response, error) => {
        if (error) {
          fail(error);
        } else if (!response.ok) {
          if (response.status === 404) {
            fail(new Error(`GitHub issue doesn't exists`));
          } else {
            fail(new Error(`Problem getting issue's data`));
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
              api.notify(COMMENTS_LOADED, newComments, null);
            })
            .catch(fail);
        }
      })
      .catch(fail);
  }

  function getIssueCommentsV3(page = 1) {
    // const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${id}/comments?page=${page}`;
    const url = `http://localhost:3000/assets/mock.v3.comments.json`;
    fetch(url, {
      headers: { Accept: 'application/vnd.github.v3.html+json' },
    }).then((response, error) => {
      if (error) {
        fail(error);
      } else if (!response.ok) {
        if (response.status === 404) {
          return fail(
            new Error(
              `No issue at https://github.com/${github.owner}/${github.repo}/issues with number ${id}`
            )
          );
        }
        if (response.status === 403) {
          if (withServer) {
            getIssueCommentsV4();
          } else {
            return fail(new Error(`Rate limit exceeded.`));
          }
        }
        return fail(new Error(`Can't load comments.`));
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
            api.notify(COMMENTS_LOADED, newComments, pagination);
          })
          .catch(fail);
      }
    });
  }

  getIssueCommentsV3();
}
