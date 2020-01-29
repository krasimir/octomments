<div align="center"><img src="./assets/logo.jpg" /></div>

<h1 align="center">Octomments</h1>

<h3 align="center">Using GitHub issues as a comment plugin for your web site.</h3>

<p align="center"><a href="https://ocs.now.sh/">https://ocs.now.sh/</a>.</p>

## What

* Client-side JavaScript library for fetching issue and adding comments to it. It also covers the GitHub [web authentication flow](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#web-application-flow) so the users will be able to post a comment directly from within your page.
* Server side JavaScript lambda functions for authentication and issue management.
* There is a default [renderer](./renderer/README.md) for the UI but you are free to build your own solution. All the events and errors are exposed.

## Why

Because I wanted:

* Just two features - listing and posting of comments
* Speed
* No ads
* No database

## Documentation

* [Client](./client/README.md)
* [Server](./server/README.md)
* [Renderer](./renderer/README.md)

## Development locally

You need to run four processes in four different terminals. Sorry! That's because we have:
* core library building and watching
* renderer library building and watching
* octomments server for authentication and GitHub v4 API support
* a small static server that loads a page containing Octomments integration

So, in each one of the following folder run `yarn` - `_local`, `client`, `renderer` and `server`. Then open four terminals pointing to those folders and run `yarn dev`. Then open [http://localhost:3000/](http://localhost:3000/).
