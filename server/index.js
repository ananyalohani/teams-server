// initialise an Express server
const express = require('express');
const app = express();
const server = require('http').Server(app);
const config = require('./config');
const { videoToken } = require('./tokens');
const { socketIOServer } = require('./socket');
const cors = require('cors');

const PORT = 5100; // port on which the server runs
const MAX_CAPACITY = 2; // maximum capacity of the room

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cors({ origin: config.allowedURLs, methods: ['GET', 'POST'] }));
app.use(express.json());

const sendTokenResponse = (token, res) => {
  res.set('Content-Type', 'application/json');
  res.send(
    JSON.stringify({
      token: token.toJwt(),
    })
  );
};

// set up API routes to get access tokens from Twilio
app.get('/video/token', (req, res) => {
  const identity = req.query.identity;
  const room = req.query.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);
});

app.post('/video/token', (req, res) => {
  const identity = req.body.identity;
  const room = req.body.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);
});

// run the socket.io server on the same port
socketIOServer(server, MAX_CAPACITY);

// server running on PORT
server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Server ready on http://localhost:${PORT}`);
});
