import React, { useEffect, useState } from 'react';

export default function StudentPage() {
  const [name, setName] = useState('');
  const [stored, setStored] = useState(false);

  useEffect(() => {
    const existingName = sessionStorage.getItem('studentName');
    if (existingName) {
      setName(existingName);
      setStored(true);
    }
  }, []);

  const handleSubmit = () => {
    if (name) {
      sessionStorage.setItem('studentName', name);
      setStored(true);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {stored ? (
        <h3>Welcome, {name} 👋</h3>
      ) : (
        <>
          <h3>Enter your name</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
          <br /><br />
          <button onClick={handleSubmit} disabled={!name}>Continue</button>
        </>
      )}
    </div>
  );
}
