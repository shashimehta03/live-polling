import React from 'react';
import { useNavigate } from 'react-router-dom';
import RoleButton from '../components/RoleButton';
import '../styles/EntryPage.css';

export default function EntryPage() {
  const navigate = useNavigate();

  return (
    <div className="entry-container">
      <h2 className="entry-title">Welcome to Live Polling</h2>
      <div className="role-buttons">
        <RoleButton label="Join as Student" onClick={() => navigate('/student')} />
        <RoleButton label="Join as Teacher" onClick={() => navigate('/teacher')} />
      </div>
    </div>
  );
}
