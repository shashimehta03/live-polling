# 🗳️ Live Polling System

A real-time polling system where teachers can create polls and students can vote, see live results, and interact via chat. Built using React, Socket.IO, and Express.js.

## 🚀 Features

### 👩‍🏫 Teacher
- ✅ Create a new poll with up to 5 options
- ✅ View live polling results in real-time
- ✅ View detailed student answers (name + selected option)
- ✅ View history of previous polls
- ✅ Can only create a new poll if:
  - Previous poll has expired (60s timer), OR
  - All students have answered
- ✅ Kick (remove) a student from the session
- ✅ Chat with students via real-time chat popup

### 🧑‍🎓 Student
- ✅ Enter a unique name per tab (refresh keeps same name)
- ✅ See the latest poll in real-time
- ✅ Submit an answer and view live results with a bar chart
- ✅ Has 60 seconds to answer; after timeout, cannot vote
- ✅ View previous poll results in the history section
- ✅ Chat with teacher in the real-time chat popup

## 🏗️ Tech Stack
- **Frontend**: React.js (Hooks), Socket.IO Client
- **Backend**: Node.js, Express.js, Socket.IO Server
- **Real-time Communication**: WebSockets (Socket.IO)

## 📂 Folder Structure
```
live-polling/
│
├── backend/
│   ├── index.js            # Express + Socket.IO server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EntryPage.jsx
│   │   │   ├── TeacherPage.jsx
│   │   │   └── StudentPage.jsx
│   │   ├── chat/
│   │   │   └── ChatPopup.jsx   # Chat feature
│   │   ├── socket.js          # Socket.IO client connection
│   │   └── styles/
│   │       ├── StudentPage.css
│   │       └── ChatPopup.css
│   └── package.json
│
└── README.md
```

## ⚡ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/live-polling.git
cd live-polling
```

### 2️⃣ Setup Backend
```bash
cd backend
npm install
node index.js
```
Backend runs at:  
👉 `http://localhost:5000`

### 3️⃣ Setup Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs at:  
👉 `http://localhost:3000`

## 🔗 How to Use?
1. Open the app in two tabs:
   - One as **Teacher**
   - One (or more) as **Students**

2. **Teacher**:
   - Creates polls, monitors answers, and can kick students if needed.
   - Can interact with students via chat popup.
   - Sees poll results live and can view past polls.

3. **Student**:
   - Enters name (only once per tab).
   - Votes before the timer runs out (60s).
   - Sees live poll results and can chat with the teacher.

## 📌 Future Enhancements
- 🔹 Role-based authentication (secure teacher access)
- 🔹 Poll analytics (graphs, participation rate)
- 🔹 Persistent storage of chat & polls in DB (currently in-memory)

## 🧑‍💻 Author
**Shashi Mehta**  
- 🌐 [Portfolio](https://shashiprofile.pages.dev/)  
- 💼 [LinkedIn](https://www.linkedin.com/in/shashi-mehta-961340229/)  
- 🐙 [GitHub](https://github.com/shashimehta03)