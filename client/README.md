# Octomments client

The core functionality of Octomments.

- [Octomments client](#octomments-client)
  - [Setup](#setup)
  - [Usage](#usage)
  - [Options](#options)
  - [Methods](#methods)
    - [api.init()](#apiinit)
    - [api.add(text)](#apiaddtext)
    - [api.on(event, callback)](#apionevent-callback)
    - [api.logout(refresh = true)](#apilogoutrefresh--true)
    - [api.page(index)](#apipageindex)
    - [api.generateNewCommentURL()](#apigeneratenewcommenturl)
    - [api.off()](#apioff)
  - [Errors](#errors)

## Setup

```html
<script src="https://unpkg.com/octomments/build/ocs.min.js"></script>
```

or 

```html
> npm i octomments
```

## Usage

```js
import Octomments from 'octomments';

function Renderer(api, container) {
  api.on(Octomments.USER_NONE, (loginURL) => {
    console.log(loginURL);
  });
}

const octomments = Octomments({
  github: {
    owner: '<username>',
    repo: '<repo name>',
  },
  issueNumber: <issue number>,
  renderer: [Renderer, '<selector>']
});

octomments.init();
```

## Options

* `github` (required) - object containing `owner` (GitHub username) and `repo` (GitHub repository) fields.
* `issueNumber` (required) - the number of an existing in the repository issue
* `renderer` (required) - an array where the first element is a renderer function and the second one is a valid DOM element selector.
* `debug` (optional) - a boolean. If `true` the library will print each of the dispatched events.
* `endpoints` (optional) - an object with `issue` and `token` fields. The values of these fields are valid URLs pointing to [Octomments server](../server) endpoints. You'll probably never need to setup those unless you deploy your own server. The already existing one is at `ocs.now.sh`.

## Methods

### api.init()

Initiates the comments and user fetching.

### api.add(text)

Adding of a new comment where `text` is the markdown of the comment.

### api.on(event, callback)

* `event` - event type
* `callback` - function called when the event is triggered

Here is a table with all the possible events:

|event | callback params | description
|---|---|---
|Octomments.ERROR | <ul><li>error</li><li>type of error</li></ul> | when there is an error. Check the [errors](#errors) section below to see the possible types.
|Octomments.COMMENTS_LOADING | <ul><li>none</li></ul> | when the loading of the comments begins
|Octomments.COMMENTS_LOADED | <ul><li>comments</li><li>pagination info</li></ul> | when the comments are loaded
|Octomments.COMMENT_SAVING | <ul><li>none</li></ul> | when the user submits a comment
|Octomments.COMMENT_SAVED | <ul><li>an array with one item - the new comment</li></ul> | when the comment is saved successfully
|Octomments.USER_LOADING | <ul><li>none</li></ul> | when the library initiates a request for the user's data
|Octomments.USER_NONE | <ul><li>user login url</li></ul> | when there is no user logged in. Use this event to render a "log in" link.
|Octomments.USER_LOADED | <ul><li>user's data</li><li>first time</li></ul> | when the data of the user is fetched successfully. The second parameter shows if the user is just logged in or his/her data is pulled from the local storage

### api.logout(refresh = true)

Removes the user's data from the localStorage and (potentially) refreshes the page.

### api.page(index)

Initiating a new comments fetching for a page with specific index.

### api.generateNewCommentURL()

Returns a URL which you can use to make the user log in. It will redirect the user to `ocs.now.sh`/GitHub for authentication and then back to your page.

### api.off()

Removes all the listeners added with `api.on`.

## Errors

* 1 - comments: issue doesn't exists
* 2 - comments: other problem loading the issue
* 3 - comments: issue request succeed but can't parse the json response
* 4 - comments: hit the V3 rate limit
* 5 - user: corrupted data in local storage
* 6 - user: can't get the access token
* 7 - user: problem parsing the access token response
* 8 - new comment: adding new comment failed
* 9 - new comment: not authorized
* 10 - new comment: request succeed but can't parse the json response
