const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

let currentPoll = null;

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send current poll to new student
  socket.on('register-student', () => {
    if (currentPoll) {
      socket.emit('new-poll', currentPoll);
    }
  });

  // Teacher creates poll
  socket.on('create-poll', (pollData) => {
    currentPoll = pollData;
    console.log('Poll created:', currentPoll);
    io.emit('new-poll', currentPoll);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
