import React, { useState, useEffect } from 'react';
import { fetchBars } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import BarCard from './BarCard';  // Import the BarCard component

// const HomePage = () => {
//   const [bars, setBars] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [location, setLocation] = useState(null);
//   const { isAuthenticated } = useAuth();

//   useEffect(() => {
//     // Get user's location
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setLocation({
//             lat: position.coords.latitude,
//             lng: position.coords.longitude
//           });
//         },
//         (error) => {
//           console.error('Error getting location:', error);
//           setError('Could not access your location.');
//         }
//       );
//     }
//   }, []);

//   // Load bars based on location
//   useEffect(() => {
//     if (isAuthenticated && location) {
//       loadBars();
//     }
//   }, [isAuthenticated, location]);

//   const loadBars = async () => {
//     try {
//       setLoading(true);
//       const response = await fetchBars({
//         lat: location.lat,
//         lng: location.lng,
//         radius: 10,
//         limit: 12
//       });
      
//       if (Array.isArray(response)) {
//         setBars(response);
//       } else if (response && Array.isArray(response.data)) {
//         setBars(response.data);
//       } else {
//         console.error("Unexpected API response format:", response);
//         setBars([]);
//       }
      
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching bars:', err);
//       setError('Failed to load bars. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 py-6">
//       <h1 className="text-3xl text-amber mb-6">Bars Near You</h1>
      
//       {error && (
//         <div className="bg-magenta bg-opacity-20 border border-magenta text-offWhite p-3 rounded-lg mb-6">
//           {error}
//         </div>
//       )}
      
//       {loading ? (
//         <div className="flex justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber"></div>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {bars && bars.length > 0 ? (
//             bars.map(bar => (
//               <BarCard key={bar.id} bar={bar} showDistance={true} />
//             ))
//           ) : (
//             <div className="col-span-full py-8 text-center text-offWhite">
//               No bars found nearby. Try expanding your search radius.
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default HomePage;
const HomePage = () => {
  const [nearbyBars, setNearbyBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get user's location and fetch bars on component mount
  useEffect(() => {
    const getNearbyBars = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user's location
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`User location: ${latitude}, ${longitude}`);
            
            // Set parameters for API request
            const params = {
              lat: latitude,
              lng: longitude,
              radius: 5000,  // 5km radius
              limit: 12      // Limit to 12 bars
            };
            
            console.log('Fetching nearby bars with params:', params);
            const data = await fetchBars(params);
            console.log(`Received ${data.length} nearby bars`);
            
            setNearbyBars(data);
            setLoading(false);
            
            if (data.length === 0) {
              setError('No bars found in your area.');
            }
          },
          (locationError) => {
            console.error('Error getting location:', locationError);
            setError('Unable to determine your location. Please enable location services.');
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } catch (err) {
        console.error('Error fetching nearby bars:', err);
        setError('Failed to load nearby bars. Please try again later.');
        setLoading(false);
      }
    };
    
    getNearbyBars();
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-amber mb-6">Nearby Bars</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <p className="mt-2">Try using the search feature instead.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {nearbyBars.length > 0 ? (
            nearbyBars.map(bar => (
              <BarCard key={bar.id} bar={bar} showDistance={true} />
            ))
          ) : (
            <div className="col-span-full text-center text-offWhite py-8">
              No nearby bars found. Try searching for bars in your area.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;