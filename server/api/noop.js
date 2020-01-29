const corsMultipleAllowOrigin = require('micro-cors-multiple-allow-origin');
const { getConfig } = require('./utils');

const config = getConfig();

module.exports = corsMultipleAllowOrigin({ origin: config.origins })(
  async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({}));
  }
);
