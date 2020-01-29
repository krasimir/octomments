/* eslint-disable no-buffer-constructor, import/no-dynamic-require */
const { parse } = require('url');
const { json } = require('micro');
const corsMultipleAllowOrigin = require('micro-cors-multiple-allow-origin');
const {
  error,
  success,
  requestGraphQL,
  getUser,
  getConfig,
} = require('./utils');

const config = getConfig();

const ISSUE_FIELDS = (filter = 'first: 100') => `
id
number
title
bodyHTML
comments(${filter}) {
  nodes {
    id
    author {
      login
      url
      avatarUrl
    }
    bodyHTML
    updatedAt
    createdAt
  }
}`;

function normalizeIssue(entry) {
  return {
    id: entry.id,
    number: entry.number,
    title: entry.title,
    body: entry.bodyHTML,
    comments:
      entry.comments && entry.comments.nodes
        ? entry.comments.nodes.map(comment => {
            const buff = Buffer.from(comment.id, 'base64');
            const id = buff.toString('utf-8').replace(/(.*):IssueComment/, '');
            return {
              id,
              url: `https://github.com/${config.github.owner}/${config.github.repo}/issues/${entry.number}#issuecomment-${id}`,
              author: comment.author,
              body: comment.bodyHTML,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt,
            };
          })
        : [],
  };
}

function normalizeRepo(graphQLResponse) {
  if (graphQLResponse && graphQLResponse.errors) {
    throw new Error(JSON.stringify(graphQLResponse, null, 2));
  }
  return {
    id: graphQLResponse.data.search.nodes[0].id,
  };
}

async function getIssueByNumber(number, filter) {
  const res = await requestGraphQL(
    `
    {
      repository(owner: "${config.github.owner}", name: "${
      config.github.repo
    }") {
        issue(number: ${number}) {
          ${ISSUE_FIELDS(filter)}
        }
      }
    }
  `,
    config.github.token
  );
  if (res && res.errors) {
    throw new Error(res.errors.map(e => e.message).join(', '));
  }
  return normalizeIssue(res.data.repository.issue);
}

async function getRepo() {
  return normalizeRepo(
    await requestGraphQL(
      `
    {
      search(query: "repo:${config.github.owner}/${config.github.repo}", type: REPOSITORY, first: 1) {
        nodes {
          ... on Repository {
            id
          }
        }
      }
    }
  `,
      config.github.token
    )
  );
}

async function createIssue(title, body) {
  const repo = await getRepo();
  const rawNewIssue = await requestGraphQL(
    `
    mutation {
      createIssue(input: {
        repositoryId: "${repo.id}"
        title: ${JSON.stringify(title)}
        body: ${JSON.stringify(body)}
      }) {
        issue {
          ${ISSUE_FIELDS('first:1')}
        }
      }
    }
  `,
    config.github.token
  );
  return rawNewIssue.data.createIssue.issue;
}

async function createComment(number, body, token) {
  const issue = await getIssueByNumber(number);
  const res = await requestGraphQL(
    `
    mutation {
      addComment(input: {
        subjectId: "${issue.id}"
        body: ${JSON.stringify(body)}
      }) {
        commentEdge {
          node {
            id
            updatedAt
            createdAt
          }
        }
      }
    }
  `,
    token
  );
  if (res.errors) {
    throw new Error(res.errors.map(e => e.message).join(', '));
  }
  return getIssueByNumber(number, 'last:1');
}

module.exports = corsMultipleAllowOrigin({ origin: config.origins })(
  async (req, res) => {
    // ------------------------------------------------------------------------
    // creating new issue or a comment
    if (req.method === 'POST') {
      const data = await json(req);

      // adding a comment
      if (data && data.comment === true) {
        if (!data.body || !data.token || !data.number) {
          return error(res, new Error('Missing or wrong data.'), 400);
        }
        try {
          await getUser(data.token);
        } catch (err) {
          return error(res, err, 401);
        }
        try {
          const updatedIssue = await createComment(
            data.number,
            data.body,
            data.token
          );
          return success(res, { issue: updatedIssue }, 201);
        } catch (err) {
          return error(res, err, 500);
        }
      }

      // adding new issue
      if (data.password !== config.password) {
        return error(res, new Error('Wrong password!'), 403);
      }

      try {
        if (!data.body || !data.title) {
          return error(res, new Error('Missing or wrong data.'), 400);
        }
        const newIssue = await createIssue(data.title, data.body);
        return success(res, { issue: newIssue }, 201);
      } catch (err) {
        console.log(err);
        return error(
          res,
          new Error(`Error getting issue with id="${data.id}".`)
        );
      }
    }

    if (req.method === 'OPTIONS') {
      return success(res, { hey: 'there' }, 201);
    }

    // ------------------------------------------------------------------------
    // getting issue
    const { query } = parse(req.url, true);
    const { number } = query;

    // getting single issue
    if (!number) {
      return error(res, new Error(`Missing "number".`), 400);
    }

    try {
      const issue = await getIssueByNumber(number);

      return success(res, { issue }, issue !== null ? 200 : 404);
    } catch (err) {
      console.log(err);
      return error(res, err, 500);
    }
  }
);
