/* eslint-disable global-require, import/no-dynamic-require */
const request = require('superagent');

const ENDPOINT = 'https://api.github.com/graphql';
const USER_ENDPOINT = 'https://api.github.com/user';

export function error(res, error, statusCode = 500) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify({ error: error.message }));
}
export function success(res, data, statusCode = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}
export async function requestGraphQL(query, token) {
  console.log(query);
  const response = await request
    .post(ENDPOINT)
    .set('Content-Type', 'application/json')
    .set('Authorization', `token ${token}`)
    .set('User-Agent', 'Node')
    .send({ query });

  if (response.ok) {
    return response.body;
  }
  throw new Error('Not able to make the request to third party.');
}
export async function getUser(token) {
  const response = await request
    .get(USER_ENDPOINT)
    .set('Authorization', `token ${token}`)
    .set('User-Agent', 'Node');

  if (response.ok) {
    // console.log(JSON.stringify(response.body, null, 2));
    return {
      login: response.body.login,
      avatarUrl: response.body.avatar_url,
      url: response.body.html_url,
      name: response.body.name,
    };
  }
  throw new Error('Not able to make the request to third party.');
}
export function getConfig() {
  return require(process.env.NODE_ENV === 'development'
    ? './config.local.json'
    : './config.json');
}
