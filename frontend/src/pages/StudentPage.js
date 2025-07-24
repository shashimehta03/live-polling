import React, { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function StudentPage() {
  const [name, setName] = useState('');
  const [stored, setStored] = useState(false);
  const [poll, setPoll] = useState(null);

  useEffect(() => {
    const existingName = sessionStorage.getItem('studentName');
    if (existingName) {
      setName(existingName);
      setStored(true);
      socket.emit('register-student');
    }

    socket.on('new-poll', (pollData) => {
      console.log('Received poll:', pollData);
      setPoll(pollData);
    });

    return () => {
      socket.off('new-poll');
    };
  }, []);

  const handleSubmit = () => {
    if (name) {
      sessionStorage.setItem('studentName', name);
      setStored(true);
      socket.emit('register-student');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {!stored ? (
        <>
          <h3>Enter Your Name</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <br /><br />
          <button onClick={handleSubmit} disabled={!name}>Submit</button>
        </>
      ) : (
        <>
          <h3>Welcome, {name} 👋</h3>
          {poll ? (
            <div>
              <h4>{poll.question}</h4>
              <ul style={{ listStyleType: 'circle', paddingLeft: 0 }}>
                {poll.options.map((opt, idx) => (
                  <li key={idx}>{opt}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No active poll yet.</p>
          )}
        </>
      )}
    </div>
  );
}
