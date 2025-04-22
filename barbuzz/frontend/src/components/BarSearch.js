import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchBars } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const BarSearch = () => {
  const [bars, setBars] = useState([]);
  const [filteredBars, setFilteredBars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadBars = async () => {
      try {
        setLoading(true);
        const response = await fetchBars();
        setBars(response.data);
        setFilteredBars(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching bars:', err);
        setError('Failed to load bars. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadBars();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterBars();
  }, [searchTerm, activeFilter, bars]);

  const filterBars = () => {
    let filtered = [...bars];
    
    // Apply text search
    if (searchTerm) {
      filtered = filtered.filter(bar => 
        bar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bar.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bar.description && bar.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply additional filters
    switch(activeFilter) {
      case 'open':
        filtered = filtered.filter(bar => bar.is_open);
        break;
      case 'short-wait':
        filtered = filtered.filter(bar => bar.current_wait < 15);
        break;
      case 'highly-rated':
        filtered = filtered.filter(bar => bar.rating >= 4);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }
    
    setFilteredBars(filtered);
  };

  // Filter chip handler
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  // Color coding for wait times
  const getWaitTimeColor = (minutes) => {
    if (!minutes && minutes !== 0) return 'bg-slate';
    if (minutes < 15) return 'bg-teal';
    if (minutes < 30) return 'bg-electricBlue';
    return 'bg-amber';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-magenta bg-opacity-20 border border-magenta text-offWhite p-4 rounded-lg mx-4 my-8">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6">
      <h1 className="text-3xl text-amber mb-6">Find Bars</h1>
      
      {/* Search input with glow effect */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, address, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate border border-white border-opacity-10 text-offWhite py-3 px-4 pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-electricBlue focus:border-transparent"
          />
          <div className="absolute right-3 top-3 text-offWhite text-opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button 
          onClick={() => handleFilterClick('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeFilter === 'all' 
              ? 'bg-electricBlue text-charcoal shadow-lg shadow-electricBlue/25' 
              : 'bg-slate text-offWhite hover:bg-slate hover:bg-opacity-80'
          }`}
        >
          All Bars
        </button>
        <button 
          onClick={() => handleFilterClick('open')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeFilter === 'open' 
              ? 'bg-teal text-charcoal shadow-lg shadow-teal/25' 
              : 'bg-slate text-offWhite hover:bg-slate hover:bg-opacity-80'
          }`}
        >
          Open Now
        </button>
        <button 
          onClick={() => handleFilterClick('short-wait')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeFilter === 'short-wait' 
              ? 'bg-amber text-charcoal shadow-lg shadow-amber/25' 
              : 'bg-slate text-offWhite hover:bg-slate hover:bg-opacity-80'
          }`}
        >
          Short Wait
        </button>
        <button 
          onClick={() => handleFilterClick('highly-rated')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeFilter === 'highly-rated' 
              ? 'bg-magenta text-charcoal shadow-lg shadow-magenta/25' 
              : 'bg-slate text-offWhite hover:bg-slate hover:bg-opacity-80'
          }`}
        >
          Highly Rated
        </button>
      </div>
      
      {filteredBars.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-offWhite text-opacity-80 text-lg">No bars found matching your criteria.</p>
          <p className="text-offWhite text-opacity-60 mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBars.map(bar => (
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
                  
                  {bar.current_wait !== undefined && (
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
        </div>
      )}
    </div>
  );
};

export default BarSearch;