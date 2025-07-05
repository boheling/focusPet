import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const petTypes = ['cat', 'dog', 'dragon', 'penguin', 'bunny'];

const Options: React.FC = () => {
  const [petType, setPetType] = useState('cat');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>focusPet Options</h1>
      <label>
        Choose your pet:
        <select value={petType} onChange={e => setPetType(e.target.value)}>
          {petTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>
      <p>Selected pet: <b>{petType}</b></p>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
} 