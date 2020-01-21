/* eslint-disable camelcase */
const { parse } = require('url');
const request = require('superagent');

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
const USER_ENDPOINT = 'https://api.github.com/user';
const config = require('./config.json');

function error(res, error, statusCode = 500) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(
    JSON.stringify({ error: error.message })
  );
}

function success(res, data, statusCode = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode
  res.end(JSON.stringify(data));
}

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
  const { code, validate } = query;

  if (validate) {
    try {
      await getUser(validate);
      return success(res, { response: 'ok' }, 200);
    } catch(err) {
      console.error(err);
      return error(res, new Error('Invalid token'), 403);
    }
  }

  try {
    const token = await getToken(code);
    const user = await getUser(token);
    return success(res, { token, ...user }, 200);
  } catch (err) {
    console.error(err);
    return error(res, err, 403);
  }
};
