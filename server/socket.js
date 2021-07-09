function socketIOServer(server, MAX_CAPACITY) {
  // initialise a Socket.io server
  const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    },
  });

  const {
    getChatSession,
    addChatToSession,
    clearChatHistory,
    addRoomToUser,
    addUserToRoom,
  } = require('./requests');

  // keep track of all the rooms and the users
  const socketsInRoom = {};
  const usersInRoom = {};

  io.on('connection', (socket) => {
    // join the room with the given id
    socket.on('join-room', ({ roomId, user }) => {
      // check if user is already in the room
      if (
        socketsInRoom[roomId]?.includes(socket.id) ||
        usersInRoom[roomId]?.find((u) => u.id === user.id)
      ) {
        socket.emit('user-already-joined');
        return;
      }

      // check if maximum room capacity has been reached
      if (
        socketsInRoom[roomId]?.length === MAX_CAPACITY ||
        usersInRoom[roomId]?.length === MAX_CAPACITY
      ) {
        socket.emit('room-full');
        return;
      }

      user.socketId = socket.id;

      // add the socket to the room
      if (socketsInRoom[roomId]) {
        socketsInRoom[roomId].push(socket.id);
      } else {
        socketsInRoom[roomId] = [socket.id];
      }

      // join the room through the socket
      socket.join(roomId);
      addRoomToUser(user.id, roomId);
      addUserToRoom(user, roomId);

      if (usersInRoom[roomId]) {
        const item = usersInRoom[roomId]?.find((u) => u.id === user.id);
        if (!item) usersInRoom[roomId].push(user);
      } else {
        usersInRoom[roomId] = [user];
      }

      getChatSession(roomId).then((chatHistory) => {
        // console.log(chatHistory);
        io.sockets.in(roomId).emit('chat-history', { chatHistory });
      });

      io.sockets
        .in(roomId)
        .emit('updated-users-list', { usersInThisRoom: usersInRoom[roomId] });

      // console.log(socketsInRoom);
      // console.log(usersInRoom);
    });

    // listen to incoming 'send-message' socket events
    socket.on('send-message', ({ roomId, chat }) => {
      // emit the message to all the sockets connected to the room
      addChatToSession(chat, roomId);
      socket.to(roomId).emit('receive-message', { chat });
    });

    // listen to incoming 'raise-hand' socket events
    socket.on('raise-hand', ({ userId, roomId }) => {
      // emit the raise-hand event to all sockets connected to the room
      socket.to(roomId).emit('user-raised-hand', { userId });
    });

    socket.on('unraise-hand', ({ userId, roomId }) => {
      // emit the raise-hand event to all sockets connected to the room
      socket.to(roomId).emit('user-unraised-hand', { userId });
    });

    // listen to incoming 'clear-chat-history' socket events
    socket.on('clear-chat-history', ({ roomId }) => {
      socket.to(roomId).emit('user-cleared-chat-history');
      clearChatHistory(roomId);
    });

    // on disconnection of the socket
    socket.on('disconnect', () => {
      // remove the user from the existing array
      const rooms = Object.keys(socketsInRoom);
      rooms.forEach((roomId) => {
        if (socketsInRoom[roomId].includes(socket.id)) {
          const remainingUsers = socketsInRoom[roomId].filter(
            (u) => u !== socket.id
          );
          const remainingUserObj = usersInRoom[roomId].filter(
            (u) => u.socketId !== socket.id
          );

          socketsInRoom[roomId] = remainingUsers;
          usersInRoom[roomId] = remainingUserObj;

          // send the updated users list to all the sockets in the room
          io.sockets.in(roomId).emit('updated-users-list', {
            usersInThisRoom: usersInRoom[roomId],
          });
        }
      });
      // console.log(socketsInRoom);
      // console.log(usersInRoom);
    });
  });
}

module.exports = { socketIOServer };
