const WebSocket = require('ws');

module.exports = (ws, body) => {
  console.log(`New player has state: ${JSON.stringify(body)}`);
  ws.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        method: 'create-player',
        body,
      }));
    }
  });
};
