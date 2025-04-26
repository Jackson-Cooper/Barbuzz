import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserFavorites, toggleFavorite } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Load favorites when authenticated
  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated) {
        setFavorites([]);
        setFavoriteIds(new Set());
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await getUserFavorites();
        
        if (Array.isArray(data)) {
          setFavorites(data);
          // Create a Set of favorite bar IDs for quick lookup
          setFavoriteIds(new Set(data.map(bar => bar.id)));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFavorites();
  }, [isAuthenticated]);

  // Function to check if a bar is favorited
  const isFavorite = (barId) => {
    return favoriteIds.has(barId);
  };

  // Function to toggle a favorite
  const toggleBarFavorite = async (barId) => {
    if (!isAuthenticated) return false;
    
    try {
      const response = await toggleFavorite(barId);
      
      // Update local state based on response
      if (response.status === 'added') {
        // If we have the bar details, add it to favorites
        setFavoriteIds(prev => new Set([...prev, barId]));
      } else {
        // Remove from favorites
        setFavoriteIds(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(barId);
          return newSet;
        });
      }
      
      // Return true if the operation was successful
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  };

  // Refresh favorites manually (useful after toggling)
  const refreshFavorites = async () => {
    try {
      setIsLoading(true);
      const data = await getUserFavorites();
      
      if (Array.isArray(data)) {
        setFavorites(data);
        setFavoriteIds(new Set(data.map(bar => bar.id)));
      }
    } catch (error) {
      console.error('Failed to refresh favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      isFavorite, 
      toggleBarFavorite, 
      refreshFavorites,
      isLoading
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);