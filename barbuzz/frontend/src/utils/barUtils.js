/**
 * Check if a bar is currently open based on its hours data
 * @param {string|Array} hoursData - Hours data in Google Places API format
 * @returns {boolean} True if the bar is currently open
 */
export const isCurrentlyOpen = (hoursData) => {
  try {
    if (!hoursData) return false;
    
    // Parse if it's a string, otherwise use as-is
    const parsedHours = typeof hoursData === 'string' ? JSON.parse(hoursData) : hoursData;
    
    // Check if it's a valid array
    if (!Array.isArray(parsedHours) || parsedHours.length === 0) {
      return false;
    }
    
    // Get current day and time
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutes = (currentHour * 60) + currentMinute;
    
    // Check each period to see if we're currently within it
    for (const period of parsedHours) {
      // Skip invalid periods
      if (!period.open || !period.close) continue;
      
      // Check if this period is for today
      if (period.open.day === currentDay) {
        // Parse opening time
        const openHour = parseInt(period.open.time.substring(0, 2));
        const openMinute = parseInt(period.open.time.substring(2));
        const openMinutes = (openHour * 60) + openMinute;
        
        // Parse closing time
        const closeHour = parseInt(period.close.time.substring(0, 2));
        const closeMinute = parseInt(period.close.time.substring(2));
        const closeMinutes = (closeHour * 60) + closeMinute;
        
        // Check if current time is within open hours
        if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
          return true;
        }
      }
      
      // Handle overnight hours (if open yesterday and closes today)
      if (period.close.day === currentDay && period.open.day !== currentDay) {
        const closeHour = parseInt(period.close.time.substring(0, 2));
        const closeMinute = parseInt(period.close.time.substring(2));
        const closeMinutes = (closeHour * 60) + closeMinute;
        
        if (currentMinutes <= closeMinutes) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking if bar is open:", error);
    return false;
  }
};

/**
 * Format hours data into a human-readable format
 * @param {string|Array} hoursData - Hours data in Google Places API format
 * @returns {Array} Array of formatted hour strings
 */
export const formatHoursDisplay = (hoursData) => {
  try {
    if (!hoursData) return [];
    
    // Parse if it's a string, otherwise use as-is
    const parsedHours = typeof hoursData === 'string' ? JSON.parse(hoursData) : hoursData;
    
    // Check if it's a valid array
    if (!Array.isArray(parsedHours) || parsedHours.length === 0) {
      return [];
    }
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedHours = [];
    
    // For each day of the week
    for (let i = 0; i < 7; i++) {
      // Find periods that start on this day
      const periodsForDay = parsedHours.filter(period => 
        period.open && period.open.day === i
      );
      
      if (periodsForDay.length === 0) {
        formattedHours.push(`${daysOfWeek[i]}: Closed`);
        continue;
      }
      
      // Format each period
      const dayHours = periodsForDay.map(period => {
        // Format opening time
        const openHour = parseInt(period.open.time.substring(0, 2));
        const openMinute = period.open.time.substring(2);
        const openPeriod = openHour >= 12 ? 'PM' : 'AM';
        const openHour12 = openHour % 12 || 12; // Convert to 12-hour format
        
        // Format closing time
        const closeHour = parseInt(period.close.time.substring(0, 2));
        const closeMinute = period.close.time.substring(2);
        const closePeriod = closeHour >= 12 ? 'PM' : 'AM';
        const closeHour12 = closeHour % 12 || 12; // Convert to 12-hour format
        
        return `${openHour12}:${openMinute} ${openPeriod} - ${closeHour12}:${closeMinute} ${closePeriod}`;
      }).join(', ');
      
      formattedHours.push(`${daysOfWeek[i]}: ${dayHours}`);
    }
    
    return formattedHours;
  } catch (error) {
    console.error("Error formatting hours:", error);
    return [];
  }
};