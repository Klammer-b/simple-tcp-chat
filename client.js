const net = require('net');
const readline = require('readline/promises');
const { ACTION_TYPES } = require('./constants');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let clientId;

const socket = net.createConnection({ port: 3099, host: '127.0.0.1' });

const moveCursor = (x, y) =>
  new Promise((resolve, reject) =>
    process.stdout.moveCursor(x, y, () => resolve()),
  );

const clearLine = (pos) =>
  new Promise((resolve, reject) =>
    process.stdout.clearLine(pos, () => resolve()),
  );

const clearPreviousLine = async () => {
  await moveCursor(0, -1);
  await clearLine(0);
};

const ask = async () => {
  const message = await rl.question('Enter your message: ');
  await clearPreviousLine();

  await socket.write(
    JSON.stringify({
      type: ACTION_TYPES.MESSAGE_SENT,
      user: { id: clientId },
      message,
    }),
  );
};

const onConnectionEstablished = (data) => {
  clientId = data.user.id;
};

const onUserJoinedHandler = async (data) => {
  console.log();
  await clearPreviousLine();

  console.log(`User with id ${data.user.id} is joined!`);

  await ask();
};

const onUserLeftHandler = async (data) => {
  console.log();
  await clearPreviousLine();

  console.log(`User with id ${data.user.id} is left`);

  await ask();
};

const onMessageSentHandler = async (data) => {
  console.log();
  await clearPreviousLine();

  console.log(`User ${data.user.id}: ${data.message}`);

  await ask();
};

const actionTypesMapper = {
  [ACTION_TYPES.CONNECTION_ESTABLISHED]: onConnectionEstablished,
  [ACTION_TYPES.USER_JOINED]: onUserJoinedHandler,
  [ACTION_TYPES.USER_LEFT]: onUserLeftHandler,
  [ACTION_TYPES.MESSAGE_SENT]: onMessageSentHandler,
};

socket.on('connect', () => {
  socket.on('data', async (data) => {
    const payload = JSON.parse(data.toString('utf-8'));
    const handler = actionTypesMapper[payload.type];

    await handler(payload);
  });
});
