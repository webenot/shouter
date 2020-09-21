module.exports = url => {
  let queryString = url.split('?');
  if (queryString[1] === undefined) return null;
  const query = {};
  queryString = queryString[1].split('&');
  for (const item of queryString) {
    const queryItem = item.split('=');
    query[queryItem[0]] = queryItem[1];
  }

  return query;
};
