function socketIOServer(server, MAX_CAPACITY) {
  // initialise a Socket.io server
  const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    },
  });

  // keep track of all the rooms and the users
  const usersInRoom = {};

  // on successful connection to the socket
  io.on('connection', (socket) => {
    // join the room with the given id
    socket.on('join-room', (roomId) => {
      // check if user is already in the room
      if (usersInRoom[roomId]?.includes(socket.id)) {
        socket.emit('user-already-joined');
        return;
      }

      // check if maximum room capacity has been reached
      if (usersInRoom[roomId]?.length === MAX_CAPACITY) {
        socket.emit('room-full');
        return;
      }

      // add the user to the room
      if (usersInRoom[roomId]) {
        usersInRoom[roomId].push(socket.id);
      } else {
        usersInRoom[roomId] = [socket.id];
      }

      // join the room through the socket
      socket.join(roomId);
      console.log(usersInRoom);
    });

    // listen to incoming 'send-message' socket events
    socket.on('send-message', ({ roomId, msgData }) => {
      // emit the message to all the sockets connected to the room
      socket.to(roomId).emit('receive-message', { msgData });
    });

    // listen to incoming 'raise-hand' socket events
    socket.on('raise-hand', ({ userId, roomId }) => {
      // emit the raise-hand event to all sockets connected to the room
      socket.to(roomId).emit('user-raised-hand', { userId });
    });

    // on disconnection of the socket
    socket.on('disconnect', () => {
      // remove the user from the existing array
      const rooms = Object.keys(usersInRoom);
      rooms.forEach((roomId) => {
        if (usersInRoom[roomId].includes(socket.id)) {
          const remainingUsers = usersInRoom[roomId].filter(
            (u) => u !== socket.id
          );
          usersInRoom[roomId] = remainingUsers;
        }
      });
      console.log(usersInRoom);
    });
  });
}

module.exports = { socketIOServer };
