const { url } = require('../lib');
const fetch = require('node-fetch');

async function getChatSession(roomId) {
  // * fetch the chat session from the db
  try {
    const result = await fetch(
      `${url.client}/api/chat-sessions?roomId=${roomId}`
    );
    const data = await result.json();
    return await data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function addChatToSession(chat, roomId) {
  // * save the chat session in the db
  try {
    const chats = await getChatSession(roomId);
    chats.push(chat);
    const stringifiedChats = JSON.stringify(chats);

    const reqBody = {
      roomId: roomId,
      chats: stringifiedChats,
    };

    await fetch(`${url.client}/api/chat-sessions`, {
      method: 'PUT',
      body: JSON.stringify(reqBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    console.error(e);
  }
}

async function clearChatHistory(roomId) {
  try {
    const reqBody = {
      roomId: roomId,
      chats: JSON.stringify([]),
    };

    await fetch(`${url.client}/api/chat-sessions`, {
      method: 'PUT',
      body: JSON.stringify(reqBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    console.error(e);
  }
}

module.exports = { getChatSession, addChatToSession };
