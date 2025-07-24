import React, { useState, useEffect } from 'react';
import { socket } from '../socket';

export default function TeacherPage() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['']);
  const [poll, setPoll] = useState(null);
  const [responses, setResponses] = useState([]);
  const [showMore, setShowMore] = useState(false);

  const maxOptions = 5;

  useEffect(() => {
    socket.on('poll-results', (data) => {
      setResponses(data);
    });

    socket.on('new-poll', (pollData) => {
      setPoll(pollData);
      setResponses([]);
    });

    return () => {
      socket.off('poll-results');
      socket.off('new-poll');
    };
  }, []);

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
          <ul>
            {Object.entries(getSummary()).map(([opt, count]) => (
              <li key={opt}>{opt}: {count}</li>
            ))}
          </ul>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
