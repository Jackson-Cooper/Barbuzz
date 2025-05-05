  /**
   * Formats an array of day+time strings into a nicer format for displaying bar hours.
   * Example input: ["Monday: 10am-5pm", "Tuesday: 10am-5pm", "Wednesday: 10am-5pm", "Saturday: 10am-4pm", "Sunday: 10am-4pm"]
   * Example output: ["Monday-Wednesday: 10am-5pm", "Saturday-Sunday: 10am-4pm"]
   * @param {string[]} hoursArray Array of day+time strings
   * @returns {string[]} Array of formatted strings
   */
const groupHours = (hoursArray) => {
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
    // Step 1: Create { time: [days] } map
    const timeMap = {};
    hoursArray.forEach(entry => {
      const [day, time] = entry.split(": ");
      if (!timeMap[time]) timeMap[time] = [];
      timeMap[time].push(day);
    });
  
    // Step 2: Convert each group to a display string
    const result = [];
    for (const [time, days] of Object.entries(timeMap)) {
      const sortedDays = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
      const ranges = [];
  
      // Group consecutive days
      for (let i = 0; i < sortedDays.length; i++) {
        const start = sortedDays[i];
        let end = start;
        while (
          i + 1 < sortedDays.length &&
          dayOrder.indexOf(sortedDays[i + 1]) === dayOrder.indexOf(end) + 1
        ) {
          end = sortedDays[++i];
        }
        ranges.push(start === end ? start : `${start}–${end}`);
      }
  
      result.push(`${ranges.join(", ")}: ${time}`);
    }
  
    return result;
  };
  
  export { groupHours };
