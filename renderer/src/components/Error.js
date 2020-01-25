import { createEl, empty } from '../utils';

/*
1 - comments: issue doesn't exists
2 - comments: other problem loading the issue
3 - comments: issue request succeed but can't parse the json response
4 - comments: hit the V3 rate limit
5 - user: corrupted data in local storage
6 - user: can't get the access token
7 - user: problem parsing the access token response
8 - new comment: adding new comment failed
9 - new comment: not authorized
10 - new comment: request succeed but can't parse the json response
*/

export default function OError($container) {
  const api = {};

  api.data = (e, type) => {
    console.log(`Octomments error ${type}`);
    console.error(e);
    empty($container);
    createEl('div', 'error', $container, e.message);
  };

  return api;
}
