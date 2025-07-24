import React, { useState } from 'react';
import { socket } from '../socket';

export default function TeacherPage() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['']);
  const maxOptions = 5;

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
    alert('Poll sent to students!');
    setQuestion('');
    setOptions(['']);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Teacher Panel</h2>
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
    </div>
  );
}
