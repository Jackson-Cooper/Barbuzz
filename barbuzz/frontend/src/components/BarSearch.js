import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchBars } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import BarCard from './BarCard';

const BarSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  
  // Restore filter state
  const [priceFilter, setPriceFilter] = useState(0); // 0 = all, 1-4 = price levels
  const [ratingFilter, setRatingFilter] = useState(0); // 0 = all, 1-5 = minimum rating
  const [openNowFilter, setOpenNowFilter] = useState(false);

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

  // Load all bars when component mounts
  useEffect(() => {
    if (isAuthenticated && location) {
      loadAllBars();
    }
  }, [isAuthenticated, location]);

  const loadAllBars = async () => {
    try {
      setLoading(true);
      const params = location ? {
        lat: location.lat,
        lng: location.lng,
        radius: 20,  // Larger radius for search
        limit: 50    // More results for search
      } : {};
      
      const response = await fetchBars(params);
      
      // Handle all possible response formats
      if (Array.isArray(response)) {
        // API returned array directly
        setSearchResults(response);
      } else if (response && Array.isArray(response.data)) {
        // API returned {data: [...]}
        setSearchResults(response.data);
      } else if (response && response.data && Array.isArray(response.data.data)) {
        // API returned {data: {data: [...]}}
        setSearchResults(response.data.data);
      } else {
        console.log("API response:", response);
        setSearchResults([]); // Empty array on unexpected format
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching bars:', err);
      setError('Failed to load bars. Please try again later.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if a bar is currently open based on hours data
  const isCurrentlyOpen = (hoursArray) => {
    if (!hoursArray || !Array.isArray(hoursArray) || hoursArray.length < 7) {
      return undefined;
    }
    
    // Get current day and time
    const now = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = daysOfWeek[now.getDay()];
    
    // Find today's hours string
    const todayHours = hoursArray.find(hourString => 
      hourString.startsWith(currentDay)
    );
    
    // If no hours for today or explicitly closed
    if (!todayHours || todayHours.includes('Closed')) {
      return false;
    }
    
    // For simplicity, assume open if hours are listed for today
    // A more accurate version would parse the actual hours
    return true;
  };

  // Filter bars based on search term and filters
  const filteredBars = searchResults && Array.isArray(searchResults) 
    ? searchResults.filter(bar => {
        // Name filter
        if (bar && bar.name && !bar.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Price filter
        if (priceFilter > 0 && (!bar.price_level || bar.price_level !== priceFilter)) {
          return false;
        }
        
        // Rating filter (convert string ratings to numbers)
        if (ratingFilter > 0) {
          const numRating = bar.rating ? parseFloat(bar.rating) : 0;
          if (numRating < ratingFilter) {
            return false;
          }
        }
        
        // Open now filter
        if (openNowFilter) {
          const isOpen = bar.is_open !== undefined 
            ? bar.is_open 
            : isCurrentlyOpen(bar.hours);
          
          if (isOpen !== true) {
            return false;
          }
        }
        
        return true;
      })
    : [];

  // Function to get a bar image
  const getBarImage = (bar) => {
    if (bar.image) return bar.image;
    
    const barImages = [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ];
    
    const index = bar.id ? bar.id % barImages.length : 0;
    return barImages[index];
  };

  // Reset all filters
  const resetFilters = () => {
    setPriceFilter(0);
    setRatingFilter(0);
    setOpenNowFilter(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl text-amber mb-4">Search Bars</h1>
      
      {/* Search input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search for bars by name..."
          className="w-full p-3 bg-slate border border-white border-opacity-10 rounded-lg text-offWhite focus:outline-none focus:ring-2 focus:ring-electricBlue"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Filter options */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Price filter */}
        <div className="flex items-center gap-2">
          <span className="text-offWhite text-sm">Price:</span>
          <div className="flex">
            {[0, 1, 2, 3, 4].map(price => (
              <button
                key={`price-${price}`}
                className={`px-3 py-1 text-sm ${
                  priceFilter === price 
                    ? 'bg-electricBlue text-charcoal' 
                    : 'bg-slate text-offWhite'
                } rounded-md mr-1`}
                onClick={() => setPriceFilter(price)}
              >
                {price === 0 ? 'All' : '$'.repeat(price)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Rating filter */}
        <div className="flex items-center gap-2">
          <span className="text-offWhite text-sm">Rating:</span>
          <div className="flex">
            {[0, 3, 3.5, 4, 4.5].map(rating => (
              <button
                key={`rating-${rating}`}
                className={`px-3 py-1 text-sm ${
                  ratingFilter === rating 
                    ? 'bg-electricBlue text-charcoal' 
                    : 'bg-slate text-offWhite'
                } rounded-md mr-1`}
                onClick={() => setRatingFilter(rating)}
              >
                {rating === 0 ? 'All' : `${rating}+`}
              </button>
            ))}
          </div>
        </div>
        
        {/* Open now filter */}
        <button
          className={`px-4 py-1 text-sm rounded-md ${
            openNowFilter 
              ? 'bg-teal text-charcoal' 
              : 'bg-slate text-offWhite'
          }`}
          onClick={() => setOpenNowFilter(!openNowFilter)}
        >
          Open Now
        </button>
        
        {/* Reset filters */}
        {(priceFilter > 0 || ratingFilter > 0 || openNowFilter) && (
          <button
            className="px-4 py-1 text-sm bg-magenta text-offWhite rounded-md"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        )}
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
        <>
          {/* Show results count */}
          <p className="text-offWhite mb-4">
            {filteredBars.length === searchResults.length 
              ? `Showing all ${searchResults.length} bars` 
              : `Showing ${filteredBars.length} of ${searchResults.length} bars`}
          </p>
          
          {/* Results grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBars && filteredBars.length > 0 ? (
              filteredBars.map(bar => (
                <BarCard key={bar.id} bar={bar} showDistance={true} />
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-offWhite">
                No bars match your search criteria
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BarSearch;