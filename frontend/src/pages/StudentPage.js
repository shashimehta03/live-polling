import React, { useEffect, useState, useRef } from 'react';
import { socket } from '../socket';
import ChatWidget from '../components/ChatWidget';
import RemovalModal from '../components/RemovalModal';
import '../styles/StudentPage.css';

export default function StudentPage() {
  const [name, setName] = useState('');
  const [stored, setStored] = useState(false);
  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showRemovalModal, setShowRemovalModal] = useState(false);

  // ✅ Timer states
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeout, setTimeoutState] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const existingName = sessionStorage.getItem('studentName');
    if (existingName) {
      setName(existingName);
      setStored(true);
      socket.emit('register-student', existingName);
    }

    // ✅ Listen for new poll
    socket.on('new-poll', (pollData) => {
      console.log('Received poll:', pollData);
      setPoll(pollData);
      setSelected('');
      setResponses([]);
      setIsCorrect(null);
      setTimeoutState(false);
      setTimeLeft(60); // Reset timer to 60 seconds
      clearInterval(timerRef.current);

      // Start countdown
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimeoutState(true);
            setSubmitted(true); // stop answering when timeout
          }
          return prev - 1;
        });
      }, 1000);

      const alreadyAnswered = sessionStorage.getItem(`answered-${pollData.question}`);
      if (alreadyAnswered === 'true') {
        setSubmitted(true);

        // ✅ Request current results again
        socket.emit('get-latest-results');
        clearInterval(timerRef.current);
      } else {
        setSubmitted(false);
      }
    });

    // ✅ Listen for live poll results
    socket.on('poll-results', (data) => {
      setResponses(data);
    });

    // Listen for removal notification (students only)
    socket.on('removed-by-teacher', () => {
      console.log('Student removed by teacher - showing modal');
      setShowRemovalModal(true);
    });

    // ✅ Request current poll when component mounts
    if (existingName) {
      socket.emit('get-current-poll');
    }

    return () => {
      socket.off('new-poll');
      socket.off('poll-results');
      socket.off('removed-by-teacher');
      clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (!selected) return;
    const correct = poll.correctAnswer === selected;
    setIsCorrect(correct);
    socket.emit('submit-answer', { name, answer: selected });
    sessionStorage.setItem(`answered-${poll.question}`, 'true');
    setSubmitted(true);
    clearInterval(timerRef.current);
  };

  const handleNameSubmit = () => {
    if (name) {
      sessionStorage.setItem('studentName', name);
      setStored(true);
      socket.emit('register-student', name);
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
          <h3>Welcome, {name} 👋</h3>
          {poll ? (
            timeout ? (
              <div className="timeout-message">
                ⏳ <strong>Oops! Timeout.</strong> Wait for the next question.
              </div>
            ) : !submitted ? (
              <div className="student-poll-form">
                <h4>{poll.question}</h4>
                <p>⏱ Time Left: <strong>{timeLeft}s</strong></p>
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
                <div className={`student-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect !== null && (
                    isCorrect ? (
                      <>
                        <span className="feedback-icon">✅</span>
                        <p>Correct! Well done!</p>
                      </>
                    ) : (
                      <>
                        <span className="feedback-icon">❌</span>
                        <p>Incorrect. The correct answer was: <strong>{poll.correctAnswer}</strong></p>
                      </>
                    )
                  )}
                </div>
                {renderBarChart()}
              </div>
            )
          ) : (
            <p>No active poll yet.</p>
          )}
        </div>
      )}

      {stored && (
        <ChatWidget
          userType="student"
          userName={name}
          userId={name}
        />
      )}
      <RemovalModal
        isOpen={showRemovalModal}
        onClose={() => setShowRemovalModal(false)}
      />
    </div>
  );
}
