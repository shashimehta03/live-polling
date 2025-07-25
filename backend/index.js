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
let answers = [];

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send current poll to new student
  socket.on('register-student', () => {
    if (currentPoll) {
      socket.emit('new-poll', currentPoll);
    }
  });

  // Send current poll + results if available on teacher refresh
  if (currentPoll) {
    socket.emit('new-poll', currentPoll);
    if (answers.length > 0) {
      socket.emit('poll-results', answers);
    }
  }

  // Teacher creates poll
  socket.on('create-poll', (pollData) => {
    currentPoll = pollData;
    console.log('Poll created:', currentPoll);
    answers = [];
    io.emit('new-poll', currentPoll);
  });

  // Student submits answer
  socket.on('submit-answer', ({ name, answer }) => {
    if (!currentPoll) return;
    const alreadyAnswered = answers.find((a) => a.name === name);
    if (alreadyAnswered) return;

    answers.push({ name, answer });
    io.emit('poll-results', answers);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
