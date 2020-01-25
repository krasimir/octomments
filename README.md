<h1 align="center">Octomments</h1>

<h3 align="center">Using GitHub issues as a comment plugin for your web site.</h3>

## What

* Client-side JavaScript library for fetching issue and adding comments to it. It also covers the GitHub [web authentication flow](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#web-application-flow) so the users will be able to post a comment directly from within your page.
* Server side JavaScript lambda functions for authentication and issue management.
* There is a default [renderer](./renderer/README.md) for the UI but you are free to build your own solution. All the events and errors are exposed.

## Documentation

* [Client](./client/README.md)
* [Server](./server/README.md)
* [Renderer](./renderer/README.md)