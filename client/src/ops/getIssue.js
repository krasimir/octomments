import {
  COMMENTS_ERROR,
  LOADING_COMMENTS,
  COMMENTS_LOADED,
} from '../constants';
import { suggestIssueCreation } from '../utils';

export default function getIssue(api) {
  const { endpoints, id } = api.options;
  const fail = e => api.notify(COMMENTS_ERROR, e);
  api.notify(LOADING_COMMENTS);
  fetch(`${endpoints.issue}?id=${id}`)
    .then((response, error) => {
      if (error) {
        fail(error);
      } else if (!response.ok) {
        if (response.status === 404) {
          suggestIssueCreation(id, endpoints.issue);
          fail(new Error(`GitHub issue doesn't exists`));
        } else {
          fail(new Error(`Problem getting issue's data`));
        }
      } else {
        response
          .json()
          .then(data => {
            if (data.issue.comments) {
              api.notify(COMMENTS_LOADED, data.issue.comments);
            } else {
              fail(new Error('Wrong data format'));
            }
          })
          .catch(fail);
      }
    })
    .catch(fail);
}
