const fs = require('fs');

['client', 'renderer', 'server'].forEach(pkg => {
  const file = __dirname + '/../' + pkg + '/package.json';
  const packageJSON = require(file);
  const bits = packageJSON.version.split('.').map(n => Number(n));
  bits[bits.length - 1] = bits[bits.length - 1] + 1;
  packageJSON.version = bits.join('.');
  fs.writeFileSync(file, JSON.stringify(packageJSON, null, 2));
  console.log(`Version of ${packageJSON.name} bumped to ${packageJSON.version}`);
})