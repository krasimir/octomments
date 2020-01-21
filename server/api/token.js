/* eslint-disable camelcase */
const { parse } = require('url');
const request = require('superagent');

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
const USER_ENDPOINT = 'https://api.github.com/user';
const config = require('./config.json');

const getToken = async code => {
  const response = await request.post(TOKEN_ENDPOINT).send({
    client_id: config.github.id,
    client_secret: config.github.secret,
    code,
  });

  if (response.ok) {
    const { access_token, error, error_description } = response.body;

    if (error) {
      throw new Error(error_description);
    } else {
      return access_token;
    }
  } else {
    throw new Error('Not able to make the request to third party.');
  }
};

const getUser = async (token) => {
  const response = await request
    .get(USER_ENDPOINT)
    .set('Authorization', 'token ' + token)
    .set('User-Agent', 'Node');

  if (response.ok) {
    // console.log(JSON.stringify(response.body, null, 2));
    return {
      login: response.body.login,
      avatarUrl: response.body.avatar_url,
      url: response.body.html_url,
      name: response.body.name
    }
  } else {
    throw new Error('Not able to make the request to third party.');
  }

  
}

module.exports = async (req, res) => {
  const { query } = parse(req.url, true);
  const { code } = query;

  try {
    const token = await getToken(code);
    const user = await getUser(token);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ token, ...user }));
  } catch (error) {
    console.error(error);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 403;
    res.end(
      JSON.stringify({ error: 'Error getting the GitHub access token.' })
    );
  }
};
