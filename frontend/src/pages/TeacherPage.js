import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { Chart } from 'chart.js/auto';
import HistoryModal from '../components/HistoryModal';
import '../styles/TeacherPage.css';

export default function TeacherPage() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [poll, setPoll] = useState(null);
  const [responses, setResponses] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pollCompleted, setPollCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pollHistory, setPollHistory] = useState([]);

  const maxOptions = 5;

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    socket.on('poll-results', (data) => {
      setResponses(data);
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

    socket.on('poll-history', (history) => {
      setPollHistory(history);
    });

    socket.emit('get-student-count');

    return () => {
      socket.off('poll-results');
      socket.off('new-poll');
      socket.off('student-count');
      socket.off('poll-history');
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

  useEffect(() => {
    if (poll && chartRef.current) {
      const summary = getSummary();
      const labels = Object.keys(summary);
      const data = Object.values(summary);

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      chartInstanceRef.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Votes',
            data: data,
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Live Poll Results',
              font: { size: 16 },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Number of Votes' },
              ticks: { stepSize: 1 },
            },
            x: {
              title: { display: true, text: 'Options' },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [poll, responses]);

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

    if (!correctAnswer) {
      alert('Please select a correct answer.');
      return;
    }

    const poll = {
      question: question.trim(),
      options: trimmedOptions,
      correctAnswer: correctAnswer,
    };

    socket.emit('create-poll', poll);
    setQuestion('');
    setOptions(['']);
    setCorrectAnswer('');
    setPoll(poll);
    setResponses([]);
    socket.emit('get-student-count');
  };

  const handleNewPoll = () => {
    setPoll(null);
    setPollCompleted(false);
    setCorrectAnswer('');
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

  const getAnswerStats = () => {
    const correct = responses.filter(res => res.isCorrect).length;
    const incorrect = responses.filter(res => !res.isCorrect).length;
    return { correct, incorrect };
  };

  const handleHistoryClick = () => {
    socket.emit('get-poll-history');
    setShowHistory(true);
  };

  return (
    <div className="teacher-container">
      <div className="teacher-header">
        <h2 className="teacher-title">Teacher Panel</h2>
        <button className="teacher-history-btn" onClick={handleHistoryClick}>
          📊 History
        </button>
      </div>

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
                  <input
                    type="radio"
                    name="correctAnswer"
                    value={opt}
                    checked={correctAnswer === opt}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="teacher-correct-radio"
                  />
                  <label className="teacher-correct-label">Correct</label>
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
          <div className="teacher-bar-chart-section">
            <h4>Live Poll Bar Chart</h4>
            <canvas ref={chartRef} style={{ maxHeight: '300px', maxWidth: '100%' }} />
          </div>

          <div className="teacher-answer-stats">
            <h4>Answer Statistics</h4>
            <div className="teacher-stats-grid">
              <div className="teacher-stat-item">
                <span className="teacher-stat-label">Total Students:</span>
                <span className="teacher-stat-value">{totalStudents}</span>
              </div>
              <div className="teacher-stat-item correct">
                <span className="teacher-stat-label">Correct Answers:</span>
                <span className="teacher-stat-value">{getAnswerStats().correct}</span>
              </div>
              <div className="teacher-stat-item incorrect">
                <span className="teacher-stat-label">Incorrect Answers:</span>
                <span className="teacher-stat-value">{getAnswerStats().incorrect}</span>
              </div>
              <div className="teacher-stat-item">
                <span className="teacher-stat-label">Success Rate:</span>
                <span className="teacher-stat-value">
                  {totalStudents > 0 ? Math.round((getAnswerStats().correct / totalStudents) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

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
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((res, idx) => (
                    <tr key={idx}>
                      <td>{res.name}</td>
                      <td>{res.answer}</td>
                      <td className={res.isCorrect ? 'correct-answer' : 'incorrect-answer'}>
                        {res.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        pollHistory={pollHistory}
      />
    </div>
  );
}
