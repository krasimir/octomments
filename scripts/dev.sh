#!/bin/sh

cd ./client
yarn dev &
cd ../renderer
yarn dev &
cd ../server
yarn dev &
cd ../_local
yarn dev &