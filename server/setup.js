#!/usr/bin/env node

/* eslint-disable import/no-dynamic-require */

const path = require('path');
const fs = require('fs');

const projectRoot = process.cwd();
const setupRoot = __dirname;
const name = path.basename(projectRoot);

function createFolder(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p);
  }
}
function write(file, data, overwrite = true) {
  if (!fs.existsSync(file) || overwrite) {
    fs.writeFileSync(file, data);
    return true;
  }
  return false;
}
function copy(from, to, overwrite = true) {
  if (!fs.existsSync(to) || overwrite) {
    fs.copyFileSync(from, to);
    return true;
  }
  return false;
}

const packageJSON = require(`${setupRoot}/package.json`);
const octommentsVersion = packageJSON.version;
const nowJSON = {
  name,
  version: 2,
  builds: [{ src: 'api/*.*', use: '@now/node' }],
  routes: [
    {
      src: '/octomments/issue',
      dest: '/api/issue.js',
    },
    {
      src: '/octomments/token',
      dest: '/api/token.js',
    },
    {
      src: '/(.*)',
      dest: 'api/noop.js',
    },
  ],
};

console.log(`\nOctomments v${octommentsVersion}\n--------------------\n`);

// package.json
packageJSON.name = name;
packageJSON.version = '0.1.0';
packageJSON.private = true;
delete packageJSON.description;
delete packageJSON.main;
delete packageJSON.scripts;
delete packageJSON.author;
delete packageJSON.license;
delete packageJSON.devDependencies;
delete packageJSON.bin;

console.log(`${name}`);

write(`${projectRoot}/package.json`, JSON.stringify(packageJSON, null, 2));
console.log(`└─ package.json`);

// now.json
if (write(`${projectRoot}/now.json`, JSON.stringify(nowJSON, null, 2), false)) {
  console.log(`└─ now.json`);
} else {
  console.log(`└─ now.json (already exists)`);
}

// api files
createFolder(`${projectRoot}/api`);
console.log(`└─ api`);
['api/issue.js', 'api/noop.js', 'api/token.js', 'api/utils.js'].forEach(f => {
  copy(`${setupRoot}/${f}`, `${projectRoot}/${f}`);
  console.log(`   └─ ${f}`);
});
if (
  copy(
    `${setupRoot}/api/config.example.json`,
    `${projectRoot}/api/config.json`,
    false
  )
) {
  console.log(`   └─ config.json`);
} else {
  console.log(`   └─ config.json (already exists)`);
}

const ignoring = [
  'api/config.json',
  'api/config.local.json',
  'node_modules',
  '*.log',
];
['.gitignore', '.npmignore'].forEach(file => {
  write(`${projectRoot}/${file}`, ignoring.join('\n'));
  console.log(`└─ ${file}`);
});

// report
console.log('\n\nNext steps:\n');
console.log(`1. Edit api/config.json`);
console.log(`Fill the dots with your settings.\n`);

console.log(`2. Run "now --prod"`);
console.log(`To deploy your server.\n`);

console.log(`3. Use the server`);
console.log('endpoints');
console.log(`└─ <url>/octomments/issue`);
console.log(`└─ <url>/octomments/token`);

console.log('\nMore info here https://github.com/krasimir/octomments');

console.log('');
