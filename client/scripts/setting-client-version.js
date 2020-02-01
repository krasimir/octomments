const fs = require('fs');
const version = require('../package.json').version;

const root = `${__dirname}/../build/`;

['ocs-core.js', 'ocs-core.min.js', 'ocs.min.js'].forEach(file => {
  let content = fs.readFileSync(root + file).toString('utf8');

  content = content.replace('{version}', version);
  fs.writeFileSync(root + file, content);
  console.log(`Version in ${file} set to ${version}`);
});
