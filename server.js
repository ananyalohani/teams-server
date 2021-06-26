// Initialise an Express server
const app = require('express')();
const server = require('http').Server(app);

// Initialise a Socket.io server
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});

// Port on which the server runs
const PORT = 5100;
const MAX_CAPACITY = 4;

// Object containing details about people in the room
const roomToUsers = {};
const usersToRoom = {};

// When socket gets connected
io.on('connection', (socket) => {
  // Join a room
  socket.on('join-room', (roomId) => {
    // check that the same user doesn't join room twice
    const isUserInRoom = roomToUsers[roomId]?.includes(socket.id);
    if (isUserInRoom) {
      socket.emit('user-already-joined');
      return;
    } else {
      if (roomToUsers[roomId]) {
        const length = roomToUsers[roomId].length;
        if (length === MAX_CAPACITY) {
          socket.emit('room-full');
          return;
        }
        roomToUsers[roomId].push(socket.id);
      } else {
        roomToUsers[roomId] = [socket.id];
      }

      usersToRoom[socket.id] = roomId;
      const usersInThisRoom = roomToUsers[roomId].filter(
        (id) => id !== socket.id
      );
      console.log(usersInThisRoom);
      socket.join(roomId);

      socket.emit('all-users', usersInThisRoom);
    }

    console.log('roomToUsers:', roomToUsers);
    console.log('usersToRoom:', usersToRoom);
  });

  // Send a signal
  socket.on('sending-signal', ({ userToSignal, callerId, signal }) => {
    io.to(userToSignal).emit('user-joined', {
      signal,
      callerId,
    });
  });

  // Receive a signal
  socket.on('returning-signal', ({ signal, callerId }) => {
    io.to(callerId).emit('receiving-returned-signal', {
      signal,
      id: socket.id,
    });
  });

  // Send message on the group chat
  socket.on('send-message', ({ roomId, msgData }) => {
    socket.to(roomId).emit('receive-message', { msgData });
  });

  // Disconnect from socket
  socket.on('disconnect', () => {
    const roomId = usersToRoom[socket.id];
    let room = roomToUsers[roomId];
    if (room) {
      // remove disconnected user from list of users
      room = room.filter((id) => id !== socket.id);
      delete usersToRoom[socket.id];
      roomToUsers[roomId] = room;
    }

    console.log('roomToUsers:', roomToUsers);
    console.log('usersToRoom:', usersToRoom);

    // signal to the client side that the user left
    socket.broadcast.emit('user-left', socket.id);
  });
});

server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Server ready on http://localhost:${PORT}`);
});
