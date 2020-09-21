module.exports = url => {
  if (url.charAt(url.length - 1) === '/' && url.length !== 1) {
    return url.substring(0, url.length - 1);
  }
  return url.split('?')[0];
};
