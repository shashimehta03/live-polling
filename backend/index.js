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
let allStudents = new Map(); // Track all students who have ever joined (socketId -> {name, isConnected})
let pollHistory = []; // Array to store previous polls with their results
let chatMessages = []; // Array to store chat messages
let connectedTeachers = new Set(); // Set to track connected teachers

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send current poll to new student
  socket.on('register-student', (name) => {
    connectedStudents.set(socket.id, name);
    allStudents.set(socket.id, { name, isConnected: true });
    updateStudentCount();
    updateParticipants();
    if (currentPoll) {
      socket.emit('new-poll', currentPoll);
    }
    // Send chat history to new student
    socket.emit('chat-history', chatMessages);
  });

  // Register teacher
  socket.on('register-teacher', () => {
    connectedTeachers.add(socket.id);
    // Send chat history to new teacher
    socket.emit('chat-history', chatMessages);
    // Send participants list to teacher
    updateParticipants();
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
    // If there's a current poll, save it to history first
    if (currentPoll && answers.length > 0) {
      const historyEntry = {
        ...currentPoll,
        answers: [...answers],
        timestamp: new Date().toISOString(),
        totalStudents: connectedStudents.size,
        correctAnswers: answers.filter(a => a.isCorrect).length,
        incorrectAnswers: answers.filter(a => !a.isCorrect).length
      };
      pollHistory.push(historyEntry);
    }

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

  // Teacher requests poll history
  socket.on('get-poll-history', () => {
    socket.emit('poll-history', pollHistory);
  });

  // Handle chat messages
  socket.on('send-message', (messageData) => {
    const message = {
      id: Date.now(),
      sender: messageData.sender,
      senderName: messageData.senderName,
      message: messageData.message,
      timestamp: new Date().toISOString(),
      senderType: messageData.senderType // 'student' or 'teacher'
    };

    chatMessages.push(message);

    // Broadcast message to all connected clients
    io.emit('new-message', message);
  });

  // Remove student (teacher only)
  socket.on('remove-student', (studentSocketId) => {
    console.log('Remove student request:', studentSocketId);
    console.log('Connected teachers:', Array.from(connectedTeachers));
    console.log('Current socket ID:', socket.id);

    if (connectedTeachers.has(socket.id)) {
      const studentData = allStudents.get(studentSocketId);
      console.log('Student data found:', studentData);

      if (studentData) {
        // Remove student's answers from current poll
        answers = answers.filter(answer => answer.name !== studentData.name);

        // Mark student as disconnected
        allStudents.set(studentSocketId, { ...studentData, isConnected: false });

        // Remove from connected students if currently connected
        if (connectedStudents.has(studentSocketId)) {
          connectedStudents.delete(studentSocketId);
        }

        // Disconnect the student if currently connected
        if (studentData.isConnected) {
          console.log('Emitting removed-by-teacher to:', studentSocketId);
          io.to(studentSocketId).emit('removed-by-teacher');
        }

        // Update counts and participants
        updateStudentCount();
        updateParticipants();

        // Update poll results
        io.emit('poll-results', answers);
      }
    } else {
      console.log('Teacher validation failed - socket not in connectedTeachers');
    }
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

    // Mark student as disconnected but keep in allStudents
    if (allStudents.has(socket.id)) {
      const studentData = allStudents.get(socket.id);
      allStudents.set(socket.id, { ...studentData, isConnected: false });
    }

    connectedStudents.delete(socket.id);
    connectedTeachers.delete(socket.id);
    updateStudentCount();
    updateParticipants();
  });

  // Helper function to update student count
  function updateStudentCount() {
    io.emit('student-count', connectedStudents.size);
  }

  // Helper function to update participants list
  function updateParticipants() {
    const participants = [];

    // Add all students (connected and disconnected)
    allStudents.forEach((studentData, socketId) => {
      participants.push({
        socketId,
        name: studentData.name,
        type: 'student',
        isConnected: studentData.isConnected
      });
    });

    // Add teachers
    connectedTeachers.forEach(teacherSocketId => {
      participants.push({
        socketId: teacherSocketId,
        name: 'Teacher',
        type: 'teacher',
        isConnected: true
      });
    });

    io.emit('participants-update', participants);
  }
});

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
