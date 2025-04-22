import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBar, fetchWaitTimes, submitWaitTime } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const BarDetail = () => {
  const { barId } = useParams();
  const [bar, setBar] = useState(null);
  const [waitTimes, setWaitTimes] = useState([]);
  const [newWaitTime, setNewWaitTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadBarDetails = async () => {
      try {
        setLoading(true);
        // Need to add this function to your API service
        const barResponse = await fetchBar(barId);
        setBar(barResponse.data);
        
        const waitTimesResponse = await fetchWaitTimes(barId);
        setWaitTimes(waitTimesResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error loading bar details:', err);
        setError('Failed to load bar details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadBarDetails();
  }, [barId]);

  const handleSubmitWaitTime = async (e) => {
    e.preventDefault();
    if (!newWaitTime) return;
    
    try {
      await submitWaitTime(barId, parseInt(newWaitTime, 10));
      // Refresh wait times
      const waitTimesResponse = await fetchWaitTimes(barId);
      setWaitTimes(waitTimesResponse.data);
      setNewWaitTime('');
    } catch (err) {
      console.error('Error submitting wait time:', err);
      setError('Failed to submit wait time. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading bar details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!bar) return <div className="not-found">Bar not found</div>;

  return (
    <div className="bar-detail">
      <h1>{bar.name}</h1>
      
      <div className="bar-info">
        <div className="address">{bar.address}</div>
        <div className="hours">Hours: {bar.hours || 'Not available'}</div>
        <div className="description">{bar.description}</div>
      </div>
      
      <div className="wait-times-section">
        <h2>Current Wait Time</h2>
        <div className="current-wait">
          {waitTimes.length > 0 ? (
            <span className="minutes">{waitTimes[0].minutes} minutes</span>
          ) : (
            <span>No wait times reported yet</span>
          )}
        </div>
        
        {isAuthenticated && (
          <form onSubmit={handleSubmitWaitTime} className="wait-form">
            <h3>Update Wait Time</h3>
            <div className="input-group">
              <input
                type="number"
                min="0"
                max="120"
                value={newWaitTime}
                onChange={(e) => setNewWaitTime(e.target.value)}
                placeholder="Wait time in minutes"
                required
              />
              <button type="submit">Submit</button>
            </div>
          </form>
        )}
        
        <div className="wait-history">
          <h3>Recent Wait Times</h3>
          {waitTimes.length > 0 ? (
            <ul>
              {waitTimes.map(time => (
                <li key={time.id}>
                  {time.minutes} minutes - {new Date(time.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No wait times reported yet</p>
          )}
        </div>
      </div>
      
      <div className="actions">
        <Link to="/search" className="back-button">Back to Search</Link>
      </div>
    </div>
  );
};

export default BarDetail;