/*
    * ThrottleUtils.js
    * This file contains utility functions to manage API call throttling
*/

const MAX_CALLS = 1; // Max calls per time unit
const WINDOW_MS = 60 * 1000; // 1 minute

const getCallData = () => {
  const data = sessionStorage.getItem('apiCallData');
  if (!data) return { count: 0, startTime: Date.now() };
  return JSON.parse(data);
};

const setCallData = (data) => {
  sessionStorage.setItem('apiCallData', JSON.stringify(data));
};

export const canMakeApiCall = () => {
  const now = Date.now();
  let { count, startTime } = getCallData();

  if (now - startTime > WINDOW_MS) {
    // Reset window
    count = 0;
    startTime = now;
  }

  if (count < MAX_CALLS) {
    setCallData({ count: count + 1, startTime });
    return true;
  }

  return false;
};
