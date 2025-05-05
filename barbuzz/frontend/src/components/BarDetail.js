import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBar, fetchWaitTimes } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const BarDetail = () => {
  const { barId } = useParams();
  const [bar, setBar] = useState(null);
  const [waitTimes, setWaitTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadBarDetails = async () => {
      try {
        setLoading(true);
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

  if (loading) return <div className="text-center text-gray-300 py-10">Loading bar details...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!bar) return <div className="text-center text-gray-300 py-10">Bar not found</div>;

  const imageUrl = bar.photo_reference
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${bar.photo_reference}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-black rounded shadow-md text-center">
      {imageUrl && (
        <div className="flex justify-center mb-6">
          <img
            src={imageUrl}
            alt={bar.name}
            className="w-64 h-48 object-cover rounded mx-auto"
          />
        </div>
      )}
      <h1 className="text-3xl font-bold mb-4 text-white">{bar.name}</h1>
      
      <div className="mb-6 text-gray-300">
        <div className="mb-2"><strong>Address:</strong> {bar.address}</div>
        <div className="mb-2"><strong>Rating:</strong> {bar.rating || 'N/A'}</div>
        <div className="mb-2">
          <strong>Website:</strong>{' '}
          {bar.website ? (
            <a href={bar.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">
              Website
            </a>
          ) : (
            'N/A'
          )}
        </div>
        <div className="mb-2"><strong>Phone:</strong> {bar.phone_number || 'N/A'}</div>
        <div className="mb-2">
          <strong>Hours:</strong> {bar.hours}
        </div>
        <div className="mb-4">{bar.description}</div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-white">Current Wait Time</h2>
        <div className="text-xl font-medium text-green-400">
          {waitTimes.length > 0 ? (
            <span>{waitTimes[0]} minutes</span>
          ) : (
            <span>No wait times available</span>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        <Link to="/search" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Back to Search
        </Link>
      </div>
    </div>
  );
};

export default BarDetail;
