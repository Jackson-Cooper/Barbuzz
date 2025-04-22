import React, { useState } from 'react';
import { fetchBars } from '../services/api';

const SearchFilters = ({ onSearch }) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    minRating: 0,
    maxDistance: 5,
    sortBy: 'distance'
  });

  const handleSearch = async () => {
    const results = await fetchBars(filters);
    onSearch(results.data);
  };

  return (
    <div className="search-filters">
      <input
        type="text"
        placeholder="Search bars..."
        value={filters.searchTerm}
        onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
      />
      
      <div className="filter-group">
        <label>Minimum Rating:</label>
        <select 
          value={filters.minRating}
          onChange={(e) => setFilters({...filters, minRating: e.target.value})}
        >
          {[0, 1, 2, 3, 4, 5].map(num => (
            <option key={num} value={num}>{num}+ stars</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Max Distance (km):</label>
        <input
          type="range"
          min="1"
          max="20"
          value={filters.maxDistance}
          onChange={(e) => setFilters({...filters, maxDistance: e.target.value})}
        />
        <span>{filters.maxDistance} km</span>
      </div>

      <button onClick={handleSearch}>Apply Filters</button>
    </div>
  );
};

export default SearchFilters;
