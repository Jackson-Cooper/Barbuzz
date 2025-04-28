import axios from 'axios';
import { getAuthToken } from '../auth/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  // If this is our login or register or current-user endpoint, skip the token header:
  if (
    config.url.endsWith('/auth/login/') ||
    config.url.endsWith('/auth/register/')
    // config.url.endsWith('/auth/user/')
  ) {
    return config;
  }

  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const fetchBars = async (params = {}) => {
  const token = localStorage.getItem('token');
  
  // Build URL with query parameters
  const url = new URL('/api/bars/', API_BASE);
  Object.keys(params).forEach(key => 
    url.searchParams.append(key, params[key])
  );
  
  console.log("Fetching from URL:", url.toString());

  const response = await fetch(url, {
    headers: {
      'Authorization': token ? `Token ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
  console.log("Response data:", response);

  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      // Redirect to login or handle unauthenticated state
      console.log("Authentication required");
    }
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  
  return await response.json();
};

export const fetchWaitTimes = (barId) => {
  return api.get('/wait-times/', { params: { bar: barId } });
};

export const login = (credentials) => {
  return api.post('/auth/login/', credentials);
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

export const fetchBar = (barId) => {
  return api.get(`/bars/${barId}/`);
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
    const response = await axios.post(`/favorites/${barId}/toggle/`);
    return response.data;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};
