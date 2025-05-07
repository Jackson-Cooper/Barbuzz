/*
    * CacheUtils.js
    * This file contains utility functions to manage caching of API responses
    * using sessionStorage.
*/

const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key) => {
  const cached = sessionStorage.getItem(key);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp < CACHE_EXPIRATION_MS) {
      return parsed.data;
    } else {
      sessionStorage.removeItem(key);
      return null;
    }
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
};

export const setCachedData = (key, data) => {
  const cacheEntry = {
    data,
    timestamp: Date.now(),
  };
  sessionStorage.setItem(key, JSON.stringify(cacheEntry));
};
