import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBar, fetchWaitTimes } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { groupHours } from './HoursFormat';
import { getCachedData, setCachedData } from '../utils/CacheUtils';

const BarDetail = () => {
  const { barId } = useParams();
  const [bar, setBar] = useState(null);
  const [waitTimes, setWaitTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiLimitError, setApiLimitError] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadBarDetails = async () => {
      try {
        setLoading(true);

        const cachedBar = getCachedData(`bar_${barId}`);
        if (cachedBar) {
          setBar(cachedBar);
        } else {
          const barResponse = await fetchBar(barId);
          setBar(barResponse.data);
          setCachedData(`bar_${barId}`, barResponse.data);
        }

        const cachedWaitTimes = getCachedData(`waitTimes_${barId}`);
        if (cachedWaitTimes) {
          setWaitTimes(cachedWaitTimes);
        } else {
          try {
            const waitTimesResponse = await fetchWaitTimes(barId);
            setWaitTimes(waitTimesResponse.data);
            setCachedData(`waitTimes_${barId}`, waitTimesResponse.data);
            setApiLimitError(false);
          } catch (err) {
            if (err.message === 'API call limit reached') {
              const cachedWaitTimes = getCachedData(`waitTimes_${barId}`);
              if (cachedWaitTimes) {
                setApiLimitError(false);
              } else {
                setApiLimitError(true);
              }
            } else {
              setWaitTimes([]);
            }
          }
        }

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

  const formattedHours = groupHours(bar.hours);
  const imageUrl = bar.image;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-charcoal rounded shadow-md text-center">
      {apiLimitError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-md z-50">
          Wait Time request limit reached. Please try again later.
          <button
            className="ml-4 bg-white text-red-600 px-2 rounded"
            onClick={() => setApiLimitError(false)}
          >
            Close
          </button>
        </div>
      )}
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
      
      <div className="flex justify-between items-center mb-6 text-gray-300">
        <div className="max-w-3xl">
          <div className="mb-2"><strong>Address:</strong> {bar.address}</div>
          <div className="mb-2"><strong>Rating:</strong> {bar.rating || 'N/A'}</div>
          <div className="mb-2">
            {bar.website ? (
              <a href={bar.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">
                Visit Website
              </a>
            ) : (
              'N/A'
            )} 
          </div>
          <div className="mb-2"><strong>Phone:</strong> {bar.phone_number || 'N/A'}</div>
          <div className="mb-2">
            <strong>Hours:</strong>
            <ul className="list-disc list-inside ml-4 text-gray-300">
              {formattedHours.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="mb-4">{bar.description}</div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-white">Current Wait Time</h2>
          <div className="text-xl font-medium text-green-400">
            {waitTimes[0] > 0 ? (
              <span>{waitTimes[0]} minutes</span>
            ) : (
              <span>No Wait Time Available</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Link to="/search" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Back to Search
        </Link>
      </div>
    </div>
  );
};

export default BarDetail;
