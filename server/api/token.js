/* eslint-disable camelcase */
const { parse } = require('url');
const request = require('superagent');
const { error, success, getUser } = require('./utils');

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
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

module.exports = async (req, res) => {
  const { query } = parse(req.url, true);
  const { code } = query;

  try {
    const token = await getToken(code);
    const user = await getUser(token);
    return success(res, { token, ...user }, 200);
  } catch (err) {
    console.error(err);
    return error(res, err, 403);
  }
};
