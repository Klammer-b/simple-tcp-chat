const net = require('net');
const { ACTION_TYPES } = require('./constants');

const clients = [];

const server = net.createServer();

const broadcastMessage = (message) =>
  Promise.all(
    clients.map((client) => {
      client.socket.write(JSON.stringify(message));
    }),
  );

server.on('connection', async (socket) => {
  const clientId = clients.length + 1;
  clients.push({
    id: clientId,
    socket,
  });

  // client socket error handler
  socket.on('error', (err) => {
    console.error(`Socket error (Client ID: ${clientId}):`, err.message);
  });

  socket.on('data', async (data) => {
    await broadcastMessage(JSON.parse(data.toString()));
  });

  socket.on('end', async () => {
    await broadcastMessage({
      user: { id: clientId },
      type: ACTION_TYPES.USER_LEFT,
    });
  });

  console.log('New connection established!');

  await socket.write(
    JSON.stringify({
      user: { id: clientId },
      type: ACTION_TYPES.CONNECTION_ESTABLISHED,
    }),
  );

  await broadcastMessage({
    user: { id: clientId },
    type: ACTION_TYPES.USER_JOINED,
  });
});

// server error handler
server.on('error', (err) => {
  console.error(`Server error:`, err.message);
});

server.listen(3099, '127.0.0.1', () => {
  console.log('server is running on', server.address());
});
