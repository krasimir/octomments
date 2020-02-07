# Octomments server

This module is a set of two lambdas which serve the following purposes:

* User authentication
* Fetching GitHub issue and its comments
* Creating a GitHub issue

There is already an instance of this server deployed here [https://ocs.now.sh/](https://ocs.now.sh/) and that's what the [client](../client) uses by default. You may want to have your own server in the following cases:

* When authenticating the user is granting access to a GitHub app. That app has a logo and name. You may want to have your own.
* The public server has a limit of 5000 request per hour. You may want to have your own 5000 request limit so you secure your users. Otherwise they'll be requesting in the same bucket as every other user using the public server.
* The GitHub issues are not created automatically by Octomments. The server offers such endpoint. So, deploying your own means that you can use that endpoint to create an issue let's say when you add a new post to your blog.

## Creating GitHub App

Go here [https://github.com/settings/apps](github.com/settings/apps) and create a new app. A few things are important:

* Set `User authorization callback URL` to the URL of your Octomments server
* `Webhook URL` is not important because we are not using it. Just use the address of your server.
* Permissions - change only `Issues` to be `Read & write`

## Setup

Create a folder on your machine (or empty repository) and run:

```
> npx octomments-server@latest
```

A couple of new files will be created:

```
├── api
│   ├── config.json
│   ├── issue.js
│   ├── noop.js
│   ├── token.js
│   └── utils.js
├── now.json
├── package.json
├── .gitignore
└── .npmignore
```

Open `api/config.json` and let's fill the placeholders.

* `password` - this password is here to protect the endpoint which creates GitHub issues. We don't want to expose this to everyone. The password is just a plain string and I know that it's not secure but this endpoint is suppose to be used in a machine-to-machine fashion. Happy to revisit this decision.
* `github.token` - create a personal token here [https://github.com/settings/tokens](https://github.com/settings/tokens) and grant only `public_repo` permission. This token is used when fetching a GitHub issue.
* `github.id` and `github.secret` - those are client id and client secret of a GitHub app. Create one here [https://github.com/settings/developers](https://github.com/settings/developers). Make sure to set a proper `Authorization callback URL`. That's the url of the site which will use your server.

Note: `api/config.json` and `api/config.local.json` are gitignored. You SHOULD NOT share these files with third parties. Do not upload them in public places. Especially dangerous is to share your personal token.

## Deployment

This server assumes that you will deploy it to [Zeit's infrastructure](https://zeit.co/). If you have your own provider you'll have to accommodate the code to fit into their requirements. Otherwise go create an account at [zeit.co](https://zeit.co/), install `now` via `npm i -g now` and run:

```
> now --prod
```

This will put your server on the web. You'll get a URL. That's the URL that you have to use when initializing the [Octomments client](../client). For example if your URL is `https://my-octomments-server.now.sh` then your Octomments snippet will be:

```js
const octomments = Octomments({
  github: {
    owner: '<username>',
    repo: '<repo name>',
  },
  number: <issue number>,
  renderer: [OctommentsRenderer, '<selector>'],
  endpoints: {
    issue: 'https://my-octomments-server.now.sh/octomments/issue',
    token: 'https://my-octomments-server.now.sh/octomments/token',
  }
});

octomments.init();
```

## Local development

After the setup you have to create an `api/config.local.json` file. Again you'll need a password, personal token and Github OAuth app created. After that just run `now dev`.

## Exposed endpoints

### Getting a GitHub issue comments

```
curl --location --request GET 'https://<url>/octomments/issue?number=<issue number>&owner=<owner>&repo=<repo>'
```

### New GitHub issue

```
curl --location --request POST 'https://<url>/octomments/issue' \
--header 'Content-Type: application/json' \
--data-raw '{
"title": "<string>",
"body": "<string>",
"password": "<your password here>",
"owner": "<owner>",
"repo": "<repo>"
}'
```

### Authorization

```
curl --location --request GET 'https://<url>/octomments/token?redirect=<url>'
```

