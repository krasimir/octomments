#!/bin/sh

node ./scripts/bumping-versions.js
cd client
yarn build
npm publish
cd ../renderer
yarn build
npm publish
cd ../
cat ./build/ocs-core.min.js ./build/ocs-ui.min.js > build/ocs.min.js
rm -rf ./server/assets/*
cp ./build/* ./server/assets
cd ./server
npm publish