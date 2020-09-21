const path = require('path');

module.exports = filePath => {
  const types = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.js': 'text/javascript; charset=UTF-8',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
  };
  return types[path.extname(filePath)] ? types[path.extname(filePath)] : 'application/octet-stream';
};
