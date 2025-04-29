import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { getUserFavorites, toggleFavorite } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState(null);
  const activeRequest = useRef(false);

  // Load favorites when authenticated
  useEffect(() => {
    // Only fetch when authenticated and no request is in progress
    if (!isAuthenticated || activeRequest.current) return;
    
    const loadFavorites = async () => {
      // Prevent duplicate requests
      if (activeRequest.current) return;
      
      try {
        setIsLoading(true);
        activeRequest.current = true;
        setError(null);
        
        const data = await getUserFavorites();
        console.log("Loaded favorites:", data); // Debug log
        
        if (Array.isArray(data)) {
          setFavorites(data);
          // Create a Set of favorite bar IDs for quick lookup
          setFavoriteIds(new Set(data.map(bar => bar.id)));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
        setError('Failed to load favorites');
      } finally {
        setIsLoading(false);
        activeRequest.current = false;
      }
    };
    
    loadFavorites();
  }, [isAuthenticated]);

  // Function to check if a bar is favorited
  const isFavorite = (barId) => {
    return favoriteIds.has(barId);
  };

  // Function to toggle a favorite with debug logging
  const toggleBarFavorite = async (barId) => {
    if (!isAuthenticated) return false;
    
    try {
      console.log(`Toggling favorite for bar ID ${barId}`); // Debug log
      const response = await toggleFavorite(barId);
      console.log("Toggle response:", response); // Debug log
      
      // Update local state based on response
      if (response.status === 'added') {
        console.log(`Adding bar ${barId} to favorites`); // Debug log
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.add(barId);
          return newSet;
        });
      } else if (response.status === 'removed') {
        console.log(`Removing bar ${barId} from favorites`); // Debug log
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(barId);
          return newSet;
        });
      }
      
      // Refresh the full favorites list to ensure consistency
      refreshFavorites();
      
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  };

  // Refresh favorites manually with safeguards
  const refreshFavorites = async () => {
    // Don't refresh if not authenticated, already loading, or have an active request
    if (!isAuthenticated || isLoading || activeRequest.current) return;

    try {
      setIsLoading(true);
      activeRequest.current = true;
      
      const data = await getUserFavorites();
      
      if (Array.isArray(data)) {
        setFavorites(data);
        setFavoriteIds(new Set(data.map(bar => bar.id)));
      }
    } catch (error) {
      console.error('Failed to refresh favorites:', error);
    } finally {
      setIsLoading(false);
      activeRequest.current = false;
    }
  };

  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      isFavorite, 
      toggleBarFavorite, 
      refreshFavorites,
      isLoading,
      error
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);