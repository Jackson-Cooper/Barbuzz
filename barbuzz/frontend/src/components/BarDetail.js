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
            <span className="minutes">{waitTimes[0]} minutes</span>
          ) : (
            <span>No wait times available</span>
          )}
        </div>
      
      <div className="actions">
        <Link to="/search" className="back-button">Back to Search</Link>
      </div>
    </div>
  </div>
  );
};

export default BarDetail;