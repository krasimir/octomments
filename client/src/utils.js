/* eslint-disable guard-for-in */
export function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export function cleanUpURL(url) {
  ['code', 'error', 'error_description', 'error_uri', 't'].forEach(a => {
    url = url.replace(new RegExp(`[\?&]${a}=[^&]+`), '');
  });
  return url;
}

export function getAuthenticationURL(tokenURL) {
  const url = cleanUpURL(window.location.href);
  return `${tokenURL}?redirect=${encodeURI(url)}`;
}

export function parseLinkHeader(link) {
  const entries = link.split(',');
  const links = {};
  for (const i in entries) {
    const entry = entries[i];
    const l = {};
    l.name = entry.match(/rel=\"([^\"]*)/)[1];
    l.url = entry.match(/<([^>]*)/)[1];
    l.page = parseInt(entry.match(/page=(\d+).*$/)[1], 10);
    links[l.name] = l;
  }
  return links;
}

export function normalizeComment(item) {
  return {
    id: item.id,
    url: item.html_url,
    author: {
      login: item.user.login,
      avatarUrl: item.user.avatar_url,
      url: item.user.html_url,
    },
    body: item.body_html,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}
