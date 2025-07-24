import React, { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function StudentPage() {
  const [name, setName] = useState('');
  const [stored, setStored] = useState(false);
  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
      setSelected('');
      setSubmitted(false);
    });

    return () => {
      socket.off('new-poll');
    };
  }, []);

  const handleSubmit = () => {
    if (!selected) return;
    socket.emit('submit-answer', { name, answer: selected });
    setSubmitted(true);
  };

  const handleNameSubmit = () => {
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
          <button onClick={handleNameSubmit} disabled={!name}>Submit</button>
        </>
      ) : (
        <>
          <h3>Welcome, {name} 👋</h3>
          {poll ? (
            !submitted ? (
              <div>
                <h4>{poll.question}</h4>
                {poll.options.map((opt, idx) => (
                  <div key={idx}>
                    <input
                      type="radio"
                      name="option"
                      value={opt}
                      checked={selected === opt}
                      onChange={() => setSelected(opt)}
                    />
                    <label>{opt}</label>
                  </div>
                ))}
                <button onClick={handleSubmit} disabled={!selected}>Submit Answer</button>
              </div>
            ) : (
              <p>✅ You have submitted your answer!</p>
            )
          ) : (
            <p>No active poll yet.</p>
          )}
        </>
      )}
    </div>
  );
}
