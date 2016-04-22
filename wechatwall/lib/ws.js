var WS_PORT = 10001;

var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
              console.log('mess');

    console.log('received: %s', message);
  });

  console.log('new client connected.');
});

wss.broadcast = function broadcast(data) {
         console.log('========');

          console.log(data);

  wss.clients.forEach(function each(client) {
        console.log('========');
    client.send(JSON.stringify(data));
  });
};

module.exports = {
  wss: wss
};

console.log("Socket server runing at port: " + WS_PORT + ".");