import axios from 'axios';
import { getAuthToken } from '../auth/AuthContext';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const fetchBars = (params = {}) => {
  return api.get('/bars/', { params });
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

export const submitWaitTime = (barId, minutes) => {
  return api.post('/wait-times/', { bar: barId, minutes });
};

export const getUserProfile = () => {
  return api.get('/user-profiles/me/');
};

export const getFavorites = () => {
  return api.get('/favorites/');
};

export const toggleFavorite = (barId) => {
  return api.post(`/favorites/${barId}/toggle/`);
};