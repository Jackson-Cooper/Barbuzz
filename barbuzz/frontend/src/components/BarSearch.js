import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchBars } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import BarCard from './BarCard';
import { isCurrentlyOpen } from '../utils/barUtils';

const BarSearch = () => {
  const [bars, setBars] = useState([]);
  const [filteredBars, setFilteredBars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  
  // Filter state variables
  const [priceFilter, setPriceFilter] = useState(0); // 0 = all, 1-4 = price levels
  const [ratingFilter, setRatingFilter] = useState(0); // 0 = all, 1-5 = minimum rating
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);

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

  // Apply filters whenever bars or filters change
  useEffect(() => {
    applyFilters();
  }, [bars, priceFilter, ratingFilter, openNowFilter, searchTerm]);

  const loadAllBars = async () => {
    try {
      setLoading(true);
      const params = {
        lat: location.lat,
        lng: location.lng,
        radius: 10, // Default radius in miles
        limit: 20
      };
      
      const data = await fetchBars(params);
      setBars(data);
      setError(null);
    } catch (err) {
      console.error('Error loading bars:', err);
      setError('Could not load bars. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // New function to search bars globally
  const searchBars = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      return loadAllBars();
    }
    
    try {
      setLoading(true);
      setIsGlobalSearch(true);
      
      const params = {
        query: searchTerm,
        global: true,
        limit: 20
      };
      
      const data = await fetchBars(params);
      setBars(data);
      setError(null);
    } catch (err) {
      console.error('Error searching bars:', err);
      setError('Could not find bars. Please try a different search.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePriceFilterChange = (level) => {
    setPriceFilter(priceFilter === level ? 0 : level);
  };

  const handleRatingFilterChange = (rating) => {
    setRatingFilter(ratingFilter === rating ? 0 : rating);
  };

  const handleOpenNowFilterChange = () => {
    setOpenNowFilter(!openNowFilter);
  };
  
  const applyFilters = () => {
    let filtered = [...bars];
    
    // Price filter
    if (priceFilter > 0) {
      filtered = filtered.filter(bar => bar.price_level === priceFilter);
    }
    
    // Rating filter
    if (ratingFilter > 0) {
      filtered = filtered.filter(bar => bar.rating >= ratingFilter);
    }
    
    // Open now filter - use the shared utility
    if (openNowFilter) {
      filtered = filtered.filter(bar => isCurrentlyOpen(bar.hours));
    }
    
    setFilteredBars(filtered);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">You need to be logged in to search for bars.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-slate rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-amber mb-4">Find Bars</h1>
        
        {/* Search bar - enhanced to support global search */}
        <form onSubmit={searchBars} className="mb-4">
          <div className="flex">
            <input
              type="text"
              placeholder="Search for any bar by name or location..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full p-3 bg-charcoal border border-slate-600 rounded-l-lg text-offWhite focus:outline-none focus:ring-2 focus:ring-electricBlue"
            />
            <button
              type="submit"
              className="bg-amber text-charcoal px-4 py-2 rounded-r-lg hover:bg-amber-600"
            >
              Search
            </button>
          </div>
        </form>
        
        {/* Filters Section */}
        <div>
          <h2 className="text-lg font-semibold text-amber mb-2">Filters</h2>
          
          {/* Price Filter */}
          <div className="mb-3">
            <label className="block text-offWhite text-sm mb-1">Price Level</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map(level => (
                <button
                  key={`price-${level}`}
                  onClick={() => handlePriceFilterChange(level)}
                  className={`px-3 py-1 rounded-md ${
                    priceFilter === level
                      ? 'bg-amber text-charcoal'
                      : 'bg-charcoal text-offWhite hover:bg-slate-700'
                  }`}
                >
                  {'$'.repeat(level)}
                </button>
              ))}
              {priceFilter > 0 && (
                <button
                  onClick={() => setPriceFilter(0)}
                  className="px-3 py-1 rounded-md bg-magenta text-offWhite hover:bg-magenta-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Rating Filter */}
          <div className="mb-3">
            <label className="block text-offWhite text-sm mb-1">Minimum Rating</label>
            <div className="flex space-x-2">
              {[2.5, 3, 3.5, 4, 4.5].map(rating => (
                <button
                  key={`rating-${rating}`}
                  onClick={() => handleRatingFilterChange(rating)}
                  className={`px-3 py-1 rounded-md ${
                    ratingFilter === rating
                      ? 'bg-amber text-charcoal'
                      : 'bg-charcoal text-offWhite hover:bg-slate-700'
                  }`}
                >
                  {rating}⭐
                </button>
              ))}
              {ratingFilter > 0 && (
                <button
                  onClick={() => setRatingFilter(0)}
                  className="px-3 py-1 rounded-md bg-magenta text-offWhite hover:bg-magenta-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Open Now Filter */}
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={openNowFilter}
                onChange={handleOpenNowFilterChange}
                className="form-checkbox h-5 w-5 text-amber rounded focus:ring-amber"
              />
              <span className="ml-2 text-offWhite text-sm">Open Now</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-magenta bg-opacity-20 border border-magenta text-offWhite p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber"></div>
        </div>
      ) : filteredBars.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBars.map(bar => (
            <BarCard 
              key={bar.id} 
              bar={bar} 
              image={(bar.image)}
              showDistance={Boolean(userLocation && bar.distance)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-offWhite">
          {bars.length > 0 
            ? "No bars match your current filters." 
            : location 
              ? "No bars found. Try a different search." 
              : "Please allow location access to find bars."}
        </div>
      )}
    </div>
  );
};

export default BarSearch;
