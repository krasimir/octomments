<div align="center"><img src="./_assets/logo.jpg" /></div>

<h1 align="center">Octomments</h1>

<h3 align="center">Using GitHub issues as a comment plugin.</h3>

<p align="center"><a href="https://ocs.now.sh/">https://ocs.now.sh/</a>.</p>

- [What is Octomments](#what-is-octomments)
- [Why](#why)
- [How to use it](#how-to-use-it)
- [How it works](#how-it-works)
  - [Listing of comments](#listing-of-comments)
  - [Adding new comment](#adding-new-comment)
- [Assets](#assets)
- [Development locally](#development-locally)
- [FAQ](#faq)

## What is Octomments

* ~6KB (gzip) JavaScript/CSS solution that creates a comment widget.
* It uses GitHub issue as a host for the comments.
* Allows your visitors to log in, stay on your page and comment from there.
* Highly [customizable](#assets).

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

When Octomments initializes it requests GitHub's v3 API based on the passed options. It gets the issue behind the provided number and its comments. The requests to GitHub's API have certain [limits](https://developer.github.com/v3/#rate-limiting). If the user is not logged in he/she can make up to 60 requests per hour. That's of course not so much and if the user reaches the limit a request to [ocs.now.sh/](https://ocs.now.sh/) is made. The API there is authorized to make up to 5000 requests per hour. Of course these 5000 requests are shared between all the people using the library. If you think that your users will hit the 60 requests limit I strongly recommend to spin up your own Octomments server. More about that [here](./server/README.md). It's not a big deal.

### Adding new comment

Your users need to be authenticated in order to post new comments. The library offers a free endpoint which helps getting a GitHub auth token. There is an endpoint at [ocs.now.sh](https://ocs.now.sh/) which implements GitHub's [web application](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#web-application-flow) authentication mechanism. You don't have to create your own GitHub app and provide client id or a secret. The only one case where you may actually want to do this is when you want your company logo/name to appear when the user is asked to grant access. In this case you have to spin up your own Octomments server. Again more about that [here](./server/README.md).

## Assets

Octomments is highly customizable. It's built of three separate modules:

* [Core client](./client/README.md) - it provides the basic logic for listing and commenting. It only exposes public methods and dispatches events. It is NOT dealing with UI.
* [Renderer](./renderer/README.md) - the renderer hooks to the core client and renders ui.
* [Server](./server/README.md) - two [Zeit NOW](https://zeit.co/docs) lambdas that help with the authorization and listing fallback. They are already deployed and working at [ocs.now.sh/](https://ocs.now.sh/)

## Development locally

```
> yarn
> yarn dev
```

_For the Octomments server you will need to create `server/api/config.local.json` file. Use `server/api/config.example.json` as a template and check the [Server](./server/README.md) documentation to understand what is what._

## FAQ

**Is Octomments creating the GitHub issues for me**

Nope. This is not happening automatically. You have two options. Either you create the issues manually or you run your own Octomments server. The server offers a protected endpoint that creates new issues.

**What is bare minimum to get Octomments on my page anyway?**

The [How to use it](#how-to-use-it) section above explains it well. You have to include two files on your page, pick a DOM element as a placeholder and run a few lines of JavaScript in a `<script>` tag.

**Can I use Octomments in my React/Vue/Angular/Svelt/<framework name here>**

Yes. There is [octomments](https://www.npmjs.com/package/octomments) npm module. You it as a starting point and build the UI on top of it.

**I don't like the UI. Can I make my own**

Sure you can. Use the [core client](./client/README.md) as a base and build on top of it.

**I want my own GitHub App**

You have to spin up your own [Octomments server](./server/README.md).
