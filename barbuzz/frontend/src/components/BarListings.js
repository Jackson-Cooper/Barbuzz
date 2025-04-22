import React, { useState } from 'react';
import { submitWaitTime } from '../services/api';

const BarListings = ({ bars, onBarSelect }) => {
  const [waitTimeInput, setWaitTimeInput] = useState({});

  const handleWaitTimeSubmit = async (barId) => {
    if (waitTimeInput[barId]) {
      await submitWaitTime(barId, waitTimeInput[barId]);
      onBarSelect(barId); // Refresh wait time display
      setWaitTimeInput({...waitTimeInput, [barId]: ''});
    }
  };

  return (
    <div className="bar-listings">
      {bars.map(bar => (
        <div key={bar.id} className="bar-card">
          <div onClick={() => onBarSelect(bar.id)}>
            <h3>{bar.name}</h3>
            <p>{bar.address}</p>
            <p>Rating: {bar.rating}/5</p>
          </div>
          
          <div className="wait-time-input">
            <input
              type="number"
              placeholder="Update wait time (mins)"
              value={waitTimeInput[bar.id] || ''}
              onChange={(e) => setWaitTimeInput({
                ...waitTimeInput,
                [bar.id]: e.target.value
              })}
            />
            <button onClick={() => handleWaitTimeSubmit(bar.id)}>
              Submit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BarListings;
