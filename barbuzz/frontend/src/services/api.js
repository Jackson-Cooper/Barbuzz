import axios from 'axios';
import { canMakeApiCall } from '../utils/ThrottleUtils';
import { getAuthToken } from '../auth/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
console.log("API_BASE", API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const login = (credentials) => {
  return api.post('/auth/login/', credentials);
};

export const fetchWaitTimes = (barId) => {
  if (!canMakeApiCall()) {
    console.warn('API call limit reached. Please try again later.');
    return Promise.reject(new Error('API call limit reached'));
  }
  return api.get('/wait-times/', { params: { bar: barId } });
};

export const fetchBars = async (params = {}) => {
  try {
    // Check if this is a global search
    const isGlobalSearch = params.query && params.global;
    
    // Log request details for debugging
    console.log('Fetching bars with params:', params);
    
    const response = await api.get('/bars/', { params });
    
    // Log response for debugging
    console.log('API response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching bars:', error);
    throw error;
  }
};

export const logout = () => {
  return api.post('/auth/logout/');
};

export const register = (userData) => {
  return api.post('/auth/register/', userData);
};

export const getCurrentUser = () => {
  return api.get('/auth/user/');
};

// Fetch a bar by its Google place ID (used as `id` in API responses)
export const fetchBar = (placeId) => {
  return api.get(`/bars/${placeId}/`);
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/user-profiles/me/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const getUserFavorites = async () => {
  try {
    const response = await api.get('/favorites/');
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
};

export const toggleFavorite = async (barId) => {
  try {
    const response = await api.post(`/favorites/${barId}/toggle/`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling favorite for bar ${barId}:`, error);
    throw error;
  }
};