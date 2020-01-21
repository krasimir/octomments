const { parse } = require('url');
const request = require('superagent');
const marked = require('marked');
const { json } = require('micro');

const ENDPOINT = 'https://api.github.com/graphql';
const config = require('./config.json');

async function requestGraphQL(query) {
  // console.log(query);
  const response = await request
    .post(ENDPOINT)
    .set('Content-Type', 'application/json')
    .set('Authorization', 'token ' + config.github.token)
    .set('User-Agent', 'Node')
    .send({ query });

  if (response.ok) {
    return response.body;
  } else {
    throw new Error('Not able to make the request to third party.');
  }
}

function normalizeIssue(graphQLResponse) {
  if (graphQLResponse && graphQLResponse.errors) {
    throw new Error(JSON.stringify(graphQLResponse, null, 2));
  }
  if (graphQLResponse.data.search.nodes.length === 0) {
    return null;
  } else {
    const entry = graphQLResponse.data.search.nodes[0];
    return {
      number: entry.number,
      title: entry.title,
      body: marked(entry.body),
      comments: entry.comments && entry.comments.nodes ? entry.comments.nodes : []
    }
  }
}

function normalizeRepo(graphQLResponse) {
  if (graphQLResponse && graphQLResponse.errors) {
    throw new Error(JSON.stringify(graphQLResponse, null, 2));
  }
  return {
    id: graphQLResponse.data.search.nodes[0].id
  }
}

async function getIssue(id) {
  return normalizeIssue(await requestGraphQL(`
    {
      search(query: "repo:${ config.github.owner }/${ config.github.repo } in:title id#${ id }", type: ISSUE, first: 1) {
        nodes {
          ... on Issue {
            number
            title
            body
            comments(first: 100) {
              nodes {
                author {
                  login
                  url
                  avatarUrl
                }
                body
              }
            }
          }
        }
      }
    }
  `));
}

async function getRepo() {
  return normalizeRepo(await requestGraphQL(`
    {
      search(query: "repo:${ config.github.owner }/${ config.github.repo }", type: REPOSITORY, first: 1) {
        nodes {
          ... on Repository {
            id
          }
        }
      }
    }
  `));
}

async function createIssue(id, title, text) {
  const repo = await getRepo();
  const rawNewIssue = await requestGraphQL(`
    mutation {
      createIssue(input: {
        repositoryId: "${ repo.id }"
        title: ${ JSON.stringify(title + ' / id#' + id) }
        body: ${ JSON.stringify(text) }
      }) {
        issue {
          number
          title
          body
        }
      }
    }
  `);
  return rawNewIssue.data.createIssue.issue;
}

function error(res, error, statusCode = 500) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(
    JSON.stringify({ error: error.message })
  );
}

function success(res, data, statusCode = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  // creating new issue
  if (req.method === 'POST') {
    const data = await json(req);

    if (!data || !data.id || !data.title || !data.text || !data.secret) {
      error(res, new Error('Missing or wrong data.'), 400);
      return;
    }

    if (data.secret !== config.addingNewIssueSecret) {
      return error(res, new Error('Not authorized to add new issues. Sorry.'), 403)
    }

    try {
      const alreadyExists = await getIssue(data.id);
      if (alreadyExists !== null) {
        return success(res, { result: 'NOOP. Already exists.' }, 200);
      }
      const newIssue = await createIssue(data.id, data.title, data.text);
      return success(res, { result: `New issue created (#${ newIssue.number }).` }, 201);
    } catch(err) {
      console.log(err);
      return error(res, new Error(`Error getting issue with id="${ id }".`))
    }

  // getting issue
  } else {
    const { query } = parse(req.url, true);
    const { id } = query;

    if (!id) {
      error(res, new Error(`No "id" provided. Please pass "id" as a GET parameter.`), 400);
      return;
    }

    try {
      const issue = await getIssue(id);

      return success(res, { issue }, issue !== null ? 200 : 404);
    } catch (err) {
      console.log(err);
      error(res, new Error(`Error getting issue with id="${ id }".`))
    }
  }
}