/* eslint-disable camelcase, import/no-dynamic-require  */
const { parse } = require('url');
const request = require('superagent');
const microCors = require('micro-cors');
const { error, success, getConfig } = require('./utils');

const cors = microCors({ allowMethods: ['GET', 'POST'] });

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
const config = getConfig();

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

module.exports = cors(async (req, res) => {
  const { query } = parse(req.url, true);
  const { code, redirect, r } = query;
  const currentURL = `${req.headers['x-forwarded-proto']}://${req.headers.host}/octomments/token?r=${redirect}`;

  if (req.method === 'OPTIONS') {
    return success(res, { hey: 'there' }, 201);
  }

  // login
  if (!code) {
    const params = [
      `client_id=${config.github.id}`,
      `redirect_uri=${`${currentURL}`}`,
      `scope=public_repo`,
    ];
    res.writeHead(301, {
      Location: `https://github.com/login/oauth/authorize?${params.join('&')}`,
    });
    return res.end();
  }

  // getting the token out of code param
  try {
    const token = await getToken(code);
    res.writeHead(301, { Location: `${r}?t=${token}` });
    return res.end();
  } catch (err) {
    console.error(err);
    return error(res, err, 403);
  }
});
