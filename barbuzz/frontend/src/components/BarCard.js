import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { isCurrentlyOpen, formatHoursDisplay } from '../utils/barUtils';
import { useEffect } from 'react';
import axios from 'axios';

const BarCard = ({ bar, showDistance = true }) => {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleBarFavorite } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);
  const [isOpen, setOpen] = useState(null);
  const [formattedHours, setFormattedHours] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Determine if bar is open using the shared utility
  useEffect(() => {
    if (bar.hours) {
      try {
        const isOpen = isCurrentlyOpen(bar.hours);
        setOpen(isOpen);
        
        // Format hours for display
        const formatted = formatHoursDisplay(bar.hours);
        setFormattedHours(formatted);
      } catch (error) {
        console.error(`Error processing hours for ${bar.name}:`, error);
      }
    }
  }, [bar]);

  useEffect(() => {
    const loadBarPhoto = async () => {
      try {
        // Reset states
        setImageLoaded(false);
        setImageError(false);
        
        // console.log(`Loading image for ${bar.name}:`, {
        //   hasImage: Boolean(bar.image),
        //   imageUrl: bar.image?.substring(0, 30) + '...'
        // });
        
        if (bar.image) {
          setImageUrl(bar.image);
        } else {
          // No image available
          setImageUrl(null);
        }
      } catch (error) {
        console.error(`Error setting up image for ${bar.name}:`, error);
        setImageError(true);
      }
    };
    
    if (bar && bar.id) {
      loadBarPhoto();
    }
  }, [bar]);

  // Check if bar is in favorites
  const favorited = isAuthenticated && isFavorite(bar.id);
  // Handle favorite toggle
  const handleFavoriteClick = async (e) => {
    // Prevent navigation to bar detail page
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || isToggling) return;
    
    try {
      setIsToggling(true);
      console.log("Clicking favorite button"); // Debug
      const success = await toggleBarFavorite(bar.id);
      console.log("Toggle result:", success); // Debug
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="relative group">
      {/* Favorite heart button */}
      {isAuthenticated && (
        <button 
          className={`absolute top-3 right-3 z-10 p-2 rounded-full bg-slate bg-opacity-70 
            transition-all duration-200 hover:bg-opacity-90 
            ${isToggling ? 'animate-pulse' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          {/* SVG Heart - filled or outline based on favorite status */}
          {favorited ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
              className="w-5 h-5 text-magenta">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.003-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
              strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-offWhite">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          )}
        </button>
      )}

      {/* Wrap the card in a Link */}
      <Link to={`/bars/${bar.id}`} className="block">
        <div className="bg-slate bg-opacity-50 backdrop-blur-sm border border-white border-opacity-10 rounded-xl overflow-hidden hover:translate-y-[-4px] transition duration-300">
          <div className="h-48 bg-gray-800 relative overflow-hidden">
            {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={bar.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              {bar.name.substring(0, 1)}
            </div>
          )}
            
            {/* Price level badge */}
            {bar.price_level > 0 && (
              <div className="absolute top-3 left-3 bg-electricBlue bg-opacity-90 text-charcoal font-semibold text-xs py-1 px-2 rounded-full">
                {'$'.repeat(bar.price_level)}
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="text-xl text-offWhite group-hover:text-amber transition">
              {bar.name || "Unnamed Bar"}
            </h3>
            <p className="text-offWhite text-opacity-70 text-sm mt-1">
              {bar.address || "No address"}
            </p>
            
            <div className="flex justify-between items-center mt-3">
              <div className="text-amber flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {bar.rating ? Number(bar.rating).toFixed(1) : 'N/A'}
              </div>
              
              {/* Open/closed status */}
              <div className={`text-xs ${isOpen ? 'text-teal' : 'text-magenta'}`}>
                {isOpen ? 'Open Now' : 'Closed'}
              </div>
              
              {/* Distance if available */}
              {showDistance && bar.distance !== undefined && (
                <div className="text-xs text-electricBlue">
                  {bar.distance.toFixed(1)} mi
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BarCard;