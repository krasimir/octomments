export function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
export function suggestIssueCreation(id, endpoint) {
  console.log(
    `Octomments: Here is a curl request to create the missing GitHub Issue. Make sure that you feel the empty fields:\n\ncurl --location --request POST '${endpoint}' --header 'Content-Type: application/json' --data-raw '{"id": "${id}", "title": "", "text": "", "secret": ""}'\n\n`
  );
}

export function cleanUpURL(url) {
  ['code', 'error', 'error_description', 'error_uri'].forEach(a => {
    url = url.replace(new RegExp(`[\?&]${a}=[^&]+`), '');
  });
  return url;
}

export function getAuthenticationURL(tokenURL) {
  const url = cleanUpURL(window.location.href);
  return `${tokenURL}?redirect_url=${encodeURI(url)}`;
}
