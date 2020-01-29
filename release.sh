#!/bin/sh

yarn bump-versions
cd client
yarn release
npm publish
cd ../renderer
yarn release
npm publish
cd ../
yarn copy-files-in-build
cd ./server
npm publish