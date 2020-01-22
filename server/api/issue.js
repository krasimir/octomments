const { parse } = require('url');
const marked = require('marked');
const { json } = require('micro');
const { error, success, requestGraphQL, getUser } = require('./utils');

const config = require('./config.json');

function normalizeIssue(entry) {
  return {
    id: entry.id,
    number: entry.number,
    title: entry.title,
    body: marked(entry.body),
    comments:
      entry.comments && entry.comments.nodes
        ? entry.comments.nodes.map(comment => ({
            author: comment.author,
            body: marked(comment.body),
          }))
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

async function getIssueByUserId(id) {
  const query = `repo:${config.github.owner}/${config.github.repo} in:title id#${id}`;
  const res = await requestGraphQL(
    `
    {
      search(query: "${query}", type: ISSUE, first: 1) {
        nodes {
          ... on Issue {
            id
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
  `,
    config.github.token
  );
  if (res && res.errors) {
    throw new Error(res.errors.map(e => e.message).join(', '));
  }
  if (res.data.search.nodes.length === 0) {
    return null;
  }
  return normalizeIssue(res.data.search.nodes[0]);
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

async function createIssue(id, title, text) {
  const repo = await getRepo();
  const rawNewIssue = await requestGraphQL(
    `
    mutation {
      createIssue(input: {
        repositoryId: "${repo.id}"
        title: ${JSON.stringify(`${title} / id#${id}`)}
        body: ${JSON.stringify(text)}
      }) {
        issue {
          number
          title
          body
        }
      }
    }
  `,
    config.github.token
  );
  return rawNewIssue.data.createIssue.issue;
}

async function createComment(id, body) {
  const issue = await getIssueByUserId(id);

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
            publishedAt
            createdAt
          }
        }
      }
    }
  `,
    config.github.token
  );
  if (res.errors) {
    throw new Error(res.errors.map(e => e.message).join(', '));
  }
  return getIssueByUserId(id);
}

module.exports = async (req, res) => {
  // creating new issue
  if (req.method === 'POST') {
    const data = await json(req);

    // adding a comment
    if (data && data.comment === true) {
      if (!data.body || !data.token || !data.id) {
        return error(res, new Error('Missing or wrong data.'), 400);
      }
      try {
        await getUser(data.token);
      } catch (err) {
        return error(res, err, 401);
      }
      try {
        const updatedIssue = await createComment(data.id, data.body);
        return success(res, { issue: updatedIssue }, 201);
      } catch (err) {
        return error(res, err, 500);
      }
    }

    if (!data || !data.id || !data.title || !data.text || !data.secret) {
      return error(res, new Error('Missing or wrong data.'), 400);
    }

    if (data.secret !== config.addingNewIssueSecret) {
      return error(
        res,
        new Error('Not authorized to add new issues. Sorry.'),
        403
      );
    }

    try {
      const alreadyExists = await getIssueByUserId(data.id);
      if (alreadyExists !== null) {
        return success(res, { result: 'NOOP. Already exists.' }, 200);
      }
      const newIssue = await createIssue(data.id, data.title, data.text);
      return success(
        res,
        { result: `New issue created (#${newIssue.number}).` },
        201
      );
    } catch (err) {
      console.log(err);
      return error(res, new Error(`Error getting issue with id="${data.id}".`));
    }

    // getting issue
  } else {
    const { query } = parse(req.url, true);
    const { id } = query;

    if (!id) {
      error(
        res,
        new Error(`No "id" provided. Please pass "id" as a GET parameter.`),
        400
      );
      return;
    }

    try {
      const issue = await getIssueByUserId(id);

      return success(res, { issue }, issue !== null ? 200 : 404);
    } catch (err) {
      console.log(err);
      error(res, err);
    }
  }
};
