import React, { useState, useEffect } from 'react';
import { fetchBars } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import BarCard from './BarCard';  // Import the BarCard component

const HomePage = () => {
  const [bars, setBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Could not access your location.');
        }
      );
    }
  }, []);

  // Load bars based on location
  useEffect(() => {
    if (isAuthenticated && location) {
      loadBars();
    }
  }, [isAuthenticated, location]);

  const loadBars = async () => {
    try {
      setLoading(true);
      const response = await fetchBars({
        lat: location.lat,
        lng: location.lng,
        radius: 10,
        limit: 12
      });
      
      if (Array.isArray(response)) {
        setBars(response);
      } else if (response && Array.isArray(response.data)) {
        setBars(response.data);
      } else {
        console.error("Unexpected API response format:", response);
        setBars([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching bars:', err);
      setError('Failed to load bars. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl text-amber mb-6">Bars Near You</h1>
      
      {error && (
        <div className="bg-magenta bg-opacity-20 border border-magenta text-offWhite p-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bars && bars.length > 0 ? (
            bars.map(bar => (
              <BarCard key={bar.id} bar={bar} showDistance={true} />
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-offWhite">
              No bars found nearby. Try expanding your search radius.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;