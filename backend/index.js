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
let connectedStudents = new Map(); // Using Map to store socket.id -> student name

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send current poll to new student
  socket.on('register-student', (name) => {
    connectedStudents.set(socket.id, name);
    updateStudentCount();
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
    updateStudentCount();
  });

  // Teacher requests student count
  socket.on('get-student-count', () => {
    updateStudentCount();
  });

  // Student submits answer
  socket.on('submit-answer', ({ name, answer }) => {
    if (!currentPoll) return;
    const alreadyAnswered = answers.find((a) => a.name === name);
    if (alreadyAnswered) return;

    // Check if answer is correct
    const isCorrect = currentPoll.correctAnswer === answer;

    answers.push({ name, answer, isCorrect });
    io.emit('poll-results', answers);
    
    // Check if all students have answered
    if (answers.length >= connectedStudents.size && connectedStudents.size > 0) {
      io.emit('poll-completed');
    }
  });

  // When a student wants the current poll again after refresh
  socket.on('get-current-poll', () => {
    if (currentPoll) {
      socket.emit('new-poll', currentPoll);
    }
  });

  // When a student wants the latest poll results after refresh
  socket.on('get-latest-results', () => {
    socket.emit('poll-results', answers);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedStudents.delete(socket.id);
    updateStudentCount();
  });

  // Helper function to update student count
  function updateStudentCount() {
    io.emit('student-count', connectedStudents.size);
  }
});

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
