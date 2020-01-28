['client', 'renderer', 'server'].forEach(pkg => {
  const file = __dirname + '/../' + pkg + '/package.json';
  const packageJSON = require(file);
})