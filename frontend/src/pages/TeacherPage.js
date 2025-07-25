import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import '../styles/TeacherPage.css';

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
    <div className="teacher-container">
      <h2 className="teacher-title">Teacher Panel</h2>

      {!poll ? (
        <div className="teacher-create-form">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Enter your poll question"
            className="teacher-question-input"
          />
          <div className="teacher-options-section">
            <h4>Options (max 5):</h4>
            <ul className="teacher-options-list">
              {options.map((opt, index) => (
                <li key={index} className="teacher-option-item">
                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="teacher-option-input"
                  />
                  {options.length > 1 && (
                    <button className="teacher-remove-option-btn" onClick={() => handleRemoveOption(index)}>
                      ❌
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {options.length < maxOptions && (
              <button className="teacher-add-option-btn" onClick={handleAddOption}>
                ➕ Add Option
              </button>
            )}
          </div>
          <br />
          <button className="teacher-create-btn" onClick={handleCreatePoll}>
            Create Poll
          </button>
        </div>
      ) : (
        <div className="teacher-poll-section">
          <h3 className="teacher-current-poll-title">📢 Current Poll: {poll.question}</h3>
          <p>Time left: {timeLeft} seconds</p>
          <p>Students answered: {responses.length}/{totalStudents}</p>
          <ul className="teacher-summary-list">
            {Object.entries(getSummary()).map(([opt, count]) => (
              <li key={opt}>{opt}: {count}</li>
            ))}
          </ul>

          {pollCompleted && (
            <div className="teacher-new-poll-btn-section">
              <button
                className="teacher-create-btn"
                onClick={handleNewPoll}
              >
                Create New Poll
              </button>
            </div>
          )}

          <button className="teacher-view-details-btn" onClick={() => setShowMore(prev => !prev)}>
            {showMore ? 'Hide Details' : 'View More'}
          </button>

          {showMore && (
            <div className="teacher-details-section">
              <h4>Student Answers</h4>
              <table className="teacher-answers-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((res, idx) => (
                    <tr key={idx}>
                      <td>{res.name}</td>
                      <td>{res.answer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Bar chart */}
              <div className="teacher-bar-chart-section">
                <h4>Live Poll Bar Chart</h4>
                {Object.entries(getSummary()).map(([option, count]) => {
                  const maxVotes = Math.max(...Object.values(getSummary()), 1);
                  const widthPercent = (count / maxVotes) * 100;

                  return (
                    <div key={option} className="teacher-bar-chart-row">
                      <strong>{option} - {count}</strong>
                      <div className="teacher-bar-chart-bar" style={{ width: `${widthPercent}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
