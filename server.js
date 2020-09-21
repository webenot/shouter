const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const normalizeUrl = require('./lib/normalizeUrl');
const getContentType = require('./lib/getFileContentType');

const port = 8888;

const httpServer = http.createServer((req, res) => {
  const url = normalizeUrl(req.url);
  if (url === '/') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(filePath)) {
      const file = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(file);
      return;
    }
  }
  if (url.indexOf('.') !== -1) {
    const filePath = path.join(__dirname, 'public', url);
    if (fs.existsSync(filePath)) {
      const file = fs.readFileSync(filePath);
      const stats = fs.lstatSync(filePath);
      //res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST');
      //res.setHeader('Access-Control-Allow-Origin', '*');
      //res.setHeader('Access-Control-Max-Age', '86400');
      res.setHeader('Cache-Control', 'max-age=31536000');
      res.setHeader('Connection', 'keep-alive');
      res.writeHead(
        200,
        {
          'Content-Type': getContentType(filePath),
          'Content-Length': file.length,
          'Last-Modified': stats.mtime.toUTCString(),
        },
      );
      res.end(file);
      return;
    }
  }
  res.statusCode = 404;
  res.statusMessage = 'Not found';
  console.log(
    `${new Date().toISOString()} \x1b[36m${req.method} \x1b[0m${req.url} - \x1b[31m${res.statusCode}\x1b[0m`,
  );
}).listen(port, () => {
  console.log(`Listening on port ${port}`);
});

httpServer.on('error', console.error);

const ws = new WebSocket.Server({ server: httpServer });

ws.on('connection', connection => {
  console.log('Connected ' + connection.remoteAddress);
  connection.on('message', message => { // Слушаем событие new-player в этом клиенте
    console.log('Message:', message);
    try {
      const data = JSON.parse(message);
      const { method, body } = data;
      const filePath = path.join(__dirname, 'WebSockets', `${method}.js`);
      console.log(filePath);
      if (fs.existsSync(filePath)) {
        const fn = require(filePath);
        fn(ws, body);
      } else {
        connection.send('No method found');
      }
    } catch (e) {
      connection.send('Message received');
    }
  });
});
