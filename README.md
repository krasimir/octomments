<div align="center"><img src="./_assets/logo.jpg" /></div>

<h1 align="center">Octomments</h1>

<h3 align="center">Using GitHub issues as a comment plugin.</h3>

<p align="center"><a href="https://ocs.now.sh/">https://ocs.now.sh/</a>.</p>

## What is Octomments

* ~6KB (gzip) JavaScript/CSS solution that creates a comment widget.
* It uses GitHub issues as a place to store the comments.
* Allows your visitors to log in, stay on your page and comment from there.

## Why

Because I wanted:

* Minimalistic comments for [my blog](https://krasimirtsonev.com/blog) 🗣️
* Speed 🏇
* No ads 🚫
* No database 🗃️

## How to use it

There are two files that you need to include on your page:

```html
<link rel="stylesheet" href="https://unpkg.com/octomments/build/ocs-ui.min.css" />
<script src="https://unpkg.com/octomments/build/ocs.min.js"></script>
```

Then you drop the following JavaScript:

```html
Octomments({
  github: {
    owner: '<username>',
    repo: '<repo name>',
  },
  number: <issue number>,
  renderer: [OctommentsRenderer, '<selector>']
}).init();
```

`<username>` is your GitHub's username. `<repo name>` is the repo where you are going to host your comments. `<issue number>` is the number of the GitHub issue that this particular page is associated with. And `<selector>` is a valid DOM element selector (the place where Octomments will load the widget).

## How it works

## Full documentation

* [Client](./client/README.md)
* [Server](./server/README.md)
* [Renderer](./renderer/README.md)

## Development locally

```
> yarn
> yarn dev
```

_For the Octomments server you will need to create `server/api/config.local.json` file. Use `server/api/config.example.json` as a template and check the [Server](./server/README.md) documentation to understand what is what._
