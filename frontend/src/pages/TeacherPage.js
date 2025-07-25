import React, { useState, useEffect } from 'react';
import { socket } from '../socket';

export default function TeacherPage() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['']);
  const [poll, setPoll] = useState(null);
  const [responses, setResponses] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pollCompleted, setPollCompleted] = useState(false);

  const maxOptions = 5;

  useEffect(() => {
    socket.on('poll-results', (data) => {
      setResponses(data);
      // Check if all students have answered
      if (data.length >= totalStudents && totalStudents > 0) {
        setPollCompleted(true);
        clearTimer();
      }
    });

    socket.on('new-poll', (pollData) => {
      setPoll(pollData);
      setResponses([]);
      setTimeLeft(60);
      setIsTimerRunning(true);
      setPollCompleted(false);
    });

    socket.on('student-count', (count) => {
      setTotalStudents(count);
    });

    // Request student count when component mounts
    socket.emit('get-student-count');

    return () => {
      socket.off('poll-results');
      socket.off('new-poll');
      socket.off('student-count');
    };
  }, [totalStudents]);

  useEffect(() => {
    let timer;
    if (isTimerRunning && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setPollCompleted(true);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isTimerRunning]);

  const clearTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(60);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < maxOptions) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleCreatePoll = () => {
    const trimmedOptions = options.map(opt => opt.trim()).filter(opt => opt);
    if (!question.trim() || trimmedOptions.length < 2) {
      alert('Please enter a question and at least 2 valid options.');
      return;
    }

    const poll = {
      question: question.trim(),
      options: trimmedOptions,
    };

    socket.emit('create-poll', poll);
    setQuestion('');
    setOptions(['']);
    setPoll(poll);
    setResponses([]);
    socket.emit('get-student-count');
  };

  const handleNewPoll = () => {
    setPoll(null);
    setPollCompleted(false);
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

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Teacher Panel</h2>

      {!poll ? (
        <>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Enter your poll question"
            style={{ width: '60%', padding: '8px', marginBottom: '20px' }}
          />
          <div style={{ textAlign: 'left', margin: 'auto', width: '60%' }}>
            <h4>Options (max 5):</h4>
            <ul style={{ listStyleType: 'disc' }}>
              {options.map((opt, index) => (
                <li key={index}>
                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    style={{ marginBottom: '8px', width: '80%' }}
                  />
                  {options.length > 1 && (
                    <button onClick={() => handleRemoveOption(index)}>❌</button>
                  )}
                </li>
              ))}
            </ul>
            {options.length < maxOptions && (
              <button onClick={handleAddOption}>➕ Add Option</button>
            )}
          </div>
          <br />
          <button onClick={handleCreatePoll} style={{ padding: '10px 20px' }}>
            Create Poll
          </button>
        </>
      ) : (
        <>
          <h3>📢 Current Poll: {poll.question}</h3>
          <p>Time left: {timeLeft} seconds</p>
          <p>Students answered: {responses.length}/{totalStudents}</p>
          <ul>
            {Object.entries(getSummary()).map(([opt, count]) => (
              <li key={opt}>{opt}: {count}</li>
            ))}
          </ul>
          
          {pollCompleted && (
            <div style={{ margin: '20px 0' }}>
              <button 
                onClick={handleNewPoll}
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create New Poll
              </button>
            </div>
          )}
          
          <button onClick={() => setShowMore(prev => !prev)}>
            {showMore ? 'Hide Details' : 'View More'}
          </button>

          {showMore && (
            <div style={{ marginTop: '10px' }}>
              <h4>Student Answers</h4>
              <table style={{ margin: 'auto', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid black', padding: '5px' }}>Name</th>
                    <th style={{ border: '1px solid black', padding: '5px' }}>Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((res, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid black', padding: '5px' }}>{res.name}</td>
                      <td style={{ border: '1px solid black', padding: '5px' }}>{res.answer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Bar chart */}
              <div style={{ marginTop: '30px', width: '80%', marginInline: 'auto' }}>
                <h4>Live Poll Bar Chart</h4>
                {Object.entries(getSummary()).map(([option, count]) => {
                  const maxVotes = Math.max(...Object.values(getSummary()), 1);
                  const widthPercent = (count / maxVotes) * 100;

                  return (
                    <div key={option} style={{ marginBottom: '12px' }}>
                      <strong>{option} - {count}</strong>
                      <div style={{
                        height: '20px',
                        backgroundColor: '#4CAF50',
                        width: `${widthPercent}%`,
                        transition: 'width 0.4s ease',
                        borderRadius: '5px',
                        marginTop: '4px'
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
