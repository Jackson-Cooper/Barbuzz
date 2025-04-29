import React, { createContext, useContext, useState, useEffect } from 'react'; // Add useEffect
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Add this effect to check for token on page load/refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      
      // Fetch user data if we have a token
      const fetchUserData = async () => {
        try {
          const userResponse = await getCurrentUser();
          setUser({
            token,
            ...userResponse.data
          });
        } catch (err) {
          console.error('Failed to fetch user data', err);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      };
      
      fetchUserData();
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      const token = response.data.token;
      
      // Store token first
      localStorage.setItem('token', token);
      
      // Then fetch user details
      try {
        const userResponse = await getCurrentUser();
        setUser({
          token,
          ...userResponse.data
        });
      } catch (userError) {
        console.error('Error fetching user details', userError);
        setUser({ token }); // Still authenticate with just the token
      }
      
      setIsAuthenticated(true);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // AuthContext.js
  const logout = async () => {
    try {
      await apiLogout();      
    } catch (err) {
      console.warn('Logout endpoint returned error (likely bad token)', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    }
  };


  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function getAuthToken() {
  return localStorage.getItem('token');
}

export function useAuth() {
  return useContext(AuthContext);
}