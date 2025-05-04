// utils/formatHours.js
const shortMap = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fullMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function formatBarHours(hoursJson) {
  if (!hoursJson || typeof hoursJson !== 'object') return 'Not available';

  const dayHourPairs = fullMap.map((day, idx) => ({
    day,
    short: shortMap[idx],
    hours: hoursJson[day] || 'Closed'
  }));

  // Group consecutive days with same hours
  const groups = [];
  let current = { start: 0, end: 0, hours: dayHourPairs[0].hours };

  for (let i = 1; i < dayHourPairs.length; i++) {
    if (dayHourPairs[i].hours === current.hours) {
      current.end = i;
    } else {
      groups.push(current);
      current = { start: i, end: i, hours: dayHourPairs[i].hours };
    }
  }
  groups.push(current);

  return groups.map(g => {
    const days = g.start === g.end
      ? shortMap[g.start]
      : `${shortMap[g.start]}–${shortMap[g.end]}`;
    return `${days}: ${g.hours}`;
  }).join('\n');
}
