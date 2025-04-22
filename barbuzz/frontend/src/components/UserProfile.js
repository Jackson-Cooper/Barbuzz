import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile, getFavorites, toggleFavorite } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        // We need to implement these endpoints in the API
        const profileResponse = await getUserProfile();
        setProfile(profileResponse.data);
        
        const favoritesResponse = await getFavorites();
        setFavorites(favoritesResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleToggleFavorite = async (barId) => {
    try {
      await toggleFavorite(barId);
      // Refresh favorites
      const favoritesResponse = await getFavorites();
      setFavorites(favoritesResponse.data);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorites. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-profile">
      <h1>My Profile</h1>
      
      <div className="profile-info">
        <div className="profile-header">
          <h2>{user?.username || 'User'}</h2>
          <p>{user?.email || 'No email available'}</p>
        </div>
        
        {profile && (
          <div className="profile-details">
            <p>Member since: {new Date(profile.dateJoined).toLocaleDateString()}</p>
            <p>Last active: {new Date(profile.lastActive).toLocaleDateString()}</p>
          </div>
        )}
      </div>
      
      <div className="favorites-section">
        <h2>My Favorite Bars</h2>
        {favorites.length > 0 ? (
          <div className="favorites-grid">
            {favorites.map(bar => (
              <div className="favorite-card" key={bar.id}>
                <h3>{bar.name}</h3>
                <p>{bar.address}</p>
                <div className="favorite-actions">
                  <Link to={`/bars/${bar.id}`} className="view-button">View Details</Link>
                  <button 
                    onClick={() => handleToggleFavorite(bar.id)}
                    className="remove-favorite"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You haven't favorited any bars yet.</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;