/* eslint-disable camelcase */
const { parse } = require('url');
const https = require('https');

const config = require('./config.json');

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';

function post() {
  return new Promise((done, reject) => {
    https
      .request('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', resp => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', chunk => {
          data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          console.log(JSON.parse(data).explanation);
        });
      })
      .on('error', reject);
  });
}

const getToken = async code => {
  const response = await post(TOKEN_ENDPOINT).send({
    client_id: config.github.id,
    client_secret: config.github.secret,
    code,
  });

  if (response.ok) {
    console.log(JSON.stringify(response.body, null, 2));
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
  const { code, CID } = query;

  try {
    const token = await getToken(CID, code);
    console.log(token);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ code }));
  } catch (error) {
    console.error(error);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 403;
    res.end(
      JSON.stringify({ error: 'Error getting the GitHub access token.' })
    );
  }
};
