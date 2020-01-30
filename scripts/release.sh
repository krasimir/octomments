#!/bin/sh

node ./scripts/bumping-versions.js

cd renderer
yarn build
npm publish

cd ../client
yarn build
npm publish

cd ../server
npm publish