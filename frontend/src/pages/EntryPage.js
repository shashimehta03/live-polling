import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EntryPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Welcome to Live Polling</h2>
      <button onClick={() => navigate('/student')}>Join as Student</button>
      <button onClick={() => navigate('/teacher')}>Join as Teacher</button>
    </div>
  );
}
