import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import '../styles/StudentPage.css';

export default function StudentPage() {
  const [name, setName] = useState('');
  const [stored, setStored] = useState(false);
  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState([]);

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
      setResponses([]);

      const alreadyAnswered = sessionStorage.getItem(`answered-${pollData.question}`);
      if (alreadyAnswered === 'true') {
        setSubmitted(true);

        // ✅ Request current results again
        socket.emit('get-latest-results');
      } else {
        setSubmitted(false);
      }
    });

    socket.on('poll-results', (data) => {
      setResponses(data);
    });

    // ✅ Request current poll (in case socket missed initial event on reconnect)
    socket.emit('get-current-poll');

    return () => {
      socket.off('new-poll');
      socket.off('poll-results');
    };
  }, []);

  const handleSubmit = () => {
    if (!selected) return;
    socket.emit('submit-answer', { name, answer: selected });
    sessionStorage.setItem(`answered-${poll.question}`, 'true'); // ✅ Save answer
    setSubmitted(true);
  };

  const handleNameSubmit = () => {
    if (name) {
      sessionStorage.setItem('studentName', name);
      setStored(true);
      socket.emit('register-student');
    }
  };

  const getSummary = () => {
    const summary = {};
    poll?.options.forEach(opt => summary[opt] = 0);
    responses.forEach(res => {
      if (summary[res.answer] !== undefined) {
        summary[res.answer]++;
      }
    });
    return summary;
  };

  const renderBarChart = () => {
    const summary = getSummary();
    const maxVotes = Math.max(...Object.values(summary), 1);

    return (
      <div style={{ marginTop: '20px', textAlign: 'left', width: '60%', marginInline: 'auto' }}>
        <h4>Live Poll Results</h4>
        {Object.entries(summary).map(([opt, count]) => {
          const barWidth = (count / maxVotes) * 100;
          return (
            <div key={opt} style={{ marginBottom: '8px' }}>
              <strong>{opt} - {count}</strong>
              <div style={{
                height: '20px',
                backgroundColor: '#4CAF50',
                width: `${barWidth}%`,
                maxWidth: '100%',
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="student-container">
      {!stored ? (
        <div className="student-name-form">
          <h3>Enter Your Name</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="student-name-input"
          />
          <br /><br />
          <button className="student-submit-btn" onClick={handleNameSubmit} disabled={!name}>Submit</button>
        </div>
      ) : (
        <div className="student-poll-section">
          <h3>Welcome, {name} <span role="img" aria-label="wave">👋</span></h3>
          {poll ? (
            !submitted ? (
              <div className="student-poll-form">
                <h4>{poll.question}</h4>
                {poll.options.map((opt, idx) => (
                  <div key={idx} className="student-option-row">
                    <input
                      type="radio"
                      name="option"
                      value={opt}
                      checked={selected === opt}
                      onChange={() => setSelected(opt)}
                      className="student-option-radio"
                    />
                    <label>{opt}</label>
                  </div>
                ))}
                <button className="student-submit-btn" onClick={handleSubmit} disabled={!selected}>Submit Answer</button>
              </div>
            ) : (
              <div className="student-submitted-section">
                <p>✅ You have submitted your answer!</p>
                {renderBarChart()}
              </div>
            )
          ) : (
            <p>No active poll yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
