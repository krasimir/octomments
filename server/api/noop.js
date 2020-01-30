const microCors = require('micro-cors');

const cors = microCors({ allowMethods: ['GET', 'POST'] });

module.exports = cors(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ noop: 'ok' }));
});
