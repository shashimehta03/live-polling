import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/student" element={<StudentPage />} />
      <Route path="/teacher" element={<TeacherPage />} />
    </Routes>
  );
}

export default App;
