import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchBars } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const HomePage = () => {
  const [nearbyBars, setNearbyBars] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Get user's location
  useEffect(() => {
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
          setError('Could not access your location. Showing general results.');
          // Load bars anyway even if location access fails
          loadBars();
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Showing general results.');
      loadBars();
    }
  }, []);

  // Load bars when location is available
  useEffect(() => {
    if (!isAuthenticated) return;
    if (location) {
      loadBars();
    }
  }, [location, isAuthenticated]);

  const loadBars = async () => {
    try {
      setLoading(true);
      // If we have location, include it in params
      const params = location ? {
        lat: location.lat,
        lng: location.lng,
        radius: 10, // 10 miles radius
        limit: 12 // Show 12 bars
      } : {};
      
      const response = await fetchBars(params);
      setNearbyBars(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching bars:', err);
      setError('Failed to load nearby bars. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Color coding for wait times
  const getWaitTimeColor = (minutes) => {
    if (!minutes) return 'bg-slate';
    if (minutes < 15) return 'bg-teal';
    if (minutes < 30) return 'bg-electricBlue';
    return 'bg-amber';
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <h1 className="text-4xl text-amber mb-4">Welcome to Barbuzz</h1>
        <p className="text-offWhite text-center text-lg mb-8">
          Find the perfect bar with real-time wait times and reviews.
        </p>
        <div className="flex gap-4">
          <Link to="/login" className="bg-electricBlue text-charcoal font-semibold px-6 py-3 rounded-full hover:bg-opacity-90 transition">
            Login
          </Link>
          <Link to="/register" className="bg-transparent border-2 border-electricBlue text-electricBlue font-semibold px-6 py-3 rounded-full hover:bg-electricBlue hover:bg-opacity-10 transition">
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl text-amber">Bars Near You</h1>
        <Link to="/search" className="text-electricBlue hover:text-opacity-80 transition">
          See all bars →
        </Link>
      </div>
      
      {error && (
        <div className="bg-magenta bg-opacity-20 border border-magenta text-offWhite p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {nearbyBars.map(bar => (
            <Link to={`/bars/${bar.id}`} key={bar.id} className="group">
              <div className="bg-slate bg-opacity-50 backdrop-blur-sm border border-white border-opacity-10 rounded-xl overflow-hidden hover:translate-y-[-4px] transition duration-300">
                <div className="h-48 bg-gray-800 relative overflow-hidden">
                  {bar.image ? (
                    <img 
                      src={bar.image} 
                      alt={bar.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate">
                      <span className="text-amber opacity-50">No image</span>
                    </div>
                  )}
                  
                  {bar.current_wait && (
                    <div className={`absolute top-3 right-3 ${getWaitTimeColor(bar.current_wait)} text-charcoal font-semibold py-1 px-3 rounded-full`}>
                      {bar.current_wait} min wait
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-xl text-offWhite group-hover:text-amber transition">{bar.name}</h3>
                  <p className="text-offWhite text-opacity-70 text-sm mt-1">{bar.address}</p>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-xs text-teal">
                      {bar.is_open ? 'Open Now' : 'Closed'}
                    </div>
                    <div className="text-amber flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {bar.rating || '0.0'}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {nearbyBars.length === 0 && !loading && (
            <div className="col-span-full py-8 text-center text-offWhite">
              No bars found nearby. Try expanding your search area.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;