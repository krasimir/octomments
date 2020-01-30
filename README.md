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
<script>
  Octomments({
    github: {
      owner: '<username>',
      repo: '<repo name>',
    },
    number: <issue number>,
    renderer: [OctommentsRenderer, '<selector>']
  }).init();
</script>
```

`<username>` is your GitHub's username. `<repo name>` is the repo where you are going to host your comments. `<issue number>` is the number of the GitHub issue that this particular page is associated with. And `<selector>` is a valid DOM element selector (the place where Octomments will load the widget).

## How it works

### Listing of comments

When Octomments initializes it requests GitHub's v3 API based on the passed options. It gets the issue behind the provided number and its comments. The requests to GitHub's API have certain [limits](https://developer.github.com/v3/#rate-limiting). If the user is not logged in he can make up to 60 requests for one hour. That's of course not so much and if the user reaches the limit a request to [ocs.now.sh/](https://ocs.now.sh/) is made. The API there is authorized to make up to 5000 requests per hour. Of course these 5000 requests are shared between all the people using the library. If you think that your users will hit the 60 requests limit I strongly recommend to spin up your own Octomments server. More about that [here](./server/README.md).

### Adding new comment

Your users need to be authenticated in order to post new comments to GitHub issues. The library offers a free endpoint for that available at [ocs.now.sh/](https://ocs.now.sh/). You don't have to create your own GitHub app and provide client id or secret. The only one case where you may actually want to do this is when you want your company logo/name to appear when the user is asked for authorization at GitHub. In this case you have to spin up your own Octomments server.  More about that [here](./server/README.md).

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
