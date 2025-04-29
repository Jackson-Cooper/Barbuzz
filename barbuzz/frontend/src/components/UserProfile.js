import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import BarCard from './BarCard';

// const UserProfile = () => {
//   const [profile, setProfile] = useState(null);
//   const [loadingProfile, setLoadingProfile] = useState(true);
//   const [error, setError] = useState(null);
//   const { user, isAuthenticated } = useAuth();
//   const { favorites, isLoading: loadingFavorites, refreshFavorites } = useFavorites();

//   // Load user profile data
//   useEffect(() => {
//     const fetchData = async () => {
//       if (!isAuthenticated) return;
      
//       try {
//         setLoadingProfile(true);
        
//         // Get profile data
//         const profileData = await getUserProfile();
//         setProfile(profileData);
        
//         // Clear any previous errors
//         setError(null);
//       } catch (err) {
//         console.error('Error loading profile:', err);
//         setError('Failed to load user profile data. Please try again.');
//       } finally {
//         setLoadingProfile(false);
//       }
//     };
    
//     fetchData();
//   }, [isAuthenticated]);
  
//   // Refresh favorites when the profile page loads
//   useEffect(() => {
//     if (isAuthenticated) {
//       refreshFavorites();
//     }
//   }, [isAuthenticated, refreshFavorites]);
const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setProfileError] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const { favorites, isLoading: loadingFavorites, error: favoritesError } = useFavorites();
  
  // Count the number of renders for debugging
  const [renderCount, setRenderCount] = useState(0);
  useEffect(() => {
    console.log("UserProfile rendered:", renderCount + 1);
  });

  // Load profile data - DON'T call refreshFavorites here
  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoadingProfile(true);
        const profileData = await getUserProfile();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setProfile(profileData);
          setProfileError(null);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        if (isMounted) {
          setProfileError('Failed to load user profile data.');
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };
    
    fetchProfile();
    
    // Cleanup function to handle unmounting
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-magenta bg-opacity-20 border border-magenta text-offWhite p-4 rounded-lg">
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl text-amber mb-6">Your Profile</h1>
      
      {error && (
        <div className="bg-magenta bg-opacity-20 border border-magenta text-offWhite p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {loadingProfile ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber"></div>
        </div>
      ) : (
        <>
          {/* User Info */}
          <div className="bg-slate bg-opacity-50 backdrop-blur-sm border border-white border-opacity-10 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-6">
              {/* Profile image - use a placeholder or user's image */}
              <div className="h-24 w-24 rounded-full bg-electricBlue flex items-center justify-center text-3xl text-charcoal font-bold">
                {user?.username ? user.username[0].toUpperCase() : '?'}
              </div>
              
              <div>
                <h2 className="text-2xl text-offWhite font-semibold">
                  {user?.username || 'User'}
                </h2>
                <p className="text-offWhite text-opacity-70">
                  {user?.email || 'No email provided'}
                </p>
                
                {/* Show joined date if available */}
                {profile?.date_joined && (
                  <p className="text-sm text-electricBlue mt-2">
                    Member since {new Date(profile.date_joined).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            
            {/* Additional user info if available */}
            {profile?.bio && (
              <div className="mt-4 border-t border-white border-opacity-10 pt-4">
                <h3 className="text-lg text-amber mb-2">Bio</h3>
                <p className="text-offWhite">{profile.bio}</p>
              </div>
            )}
          </div>
          
          {/* Favorite Bars */}
          <div>
            <h2 className="text-2xl text-amber mb-4">Your Favorite Bars</h2>
            
            {loadingFavorites ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber"></div>
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {favorites.map(bar => (
                  <BarCard key={bar.id} bar={bar} showDistance={false} />
                ))}
              </div>
            ) : (
              <div className="bg-slate bg-opacity-30 border border-white border-opacity-10 rounded-lg p-8 text-center">
                <p className="text-offWhite text-opacity-80">You don't have any favorite bars yet.</p>
                <p className="text-electricBlue mt-2">
                  Click the heart icon on any bar card to add it to your favorites!
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;