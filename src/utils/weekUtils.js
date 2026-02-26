/**
 * Monday-anchored ISO week utilities
 */

/**
 * Returns a 'YYYY-WW' week key for a given date (Monday-anchored).
 * Uses ISO week numbering.
 */
export function getWeekKey(date = new Date()) {
  const d = new Date(date);
  // Shift to Monday as day 0 (ISO: Mon=1...Sun=7, JS: Sun=0...Sat=6)
  const day = (d.getDay() + 6) % 7; // Mon=0, Tue=1...Sun=6
  d.setDate(d.getDate() - day); // rewind to Monday
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  // ISO week: days since Jan 1 / 7, accounting for start-of-year day
  const startDay = (startOfYear.getDay() + 6) % 7; // Mon=0
  const weekNum = Math.floor((d - startOfYear) / (7 * 24 * 3600 * 1000) + startDay / 7) + 1;
  return `${year}-${String(weekNum).padStart(2, '0')}`;
}

/**
 * Returns the Monday Date of a given week key.
 */
export function weekKeyToMonday(weekKey) {
  const [year, week] = weekKey.split('-').map(Number);
  // Find Jan 1 of the year, then find first Monday on or after Jan 1
  const jan1 = new Date(year, 0, 1);
  const jan1Day = (jan1.getDay() + 6) % 7; // Mon=0
  // ISO week 1 starts on the Monday of the week that contains Jan 4
  const monday = new Date(year, 0, 4);
  monday.setDate(4 - ((monday.getDay() + 6) % 7)); // Monday of ISO week 1
  monday.setDate(monday.getDate() + (week - 1) * 7);
  return monday;
}

/**
 * Returns 'YYYY-MM-DD' string for a date.
 */
export function toDateString(date = new Date()) {
  const d = new Date(date);
  // Use local date parts to avoid UTC-offset shifting the date
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Returns a human-readable week label like "Feb 24 – Mar 2".
 */
export function weekLabel(weekKey) {
  const monday = weekKeyToMonday(weekKey);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

/**
 * Returns the weekKey for the previous week.
 */
export function prevWeekKey(weekKey) {
  const monday = weekKeyToMonday(weekKey);
  monday.setDate(monday.getDate() - 7);
  return getWeekKey(monday);
}

/**
 * Returns the weekKey for the next week.
 */
export function nextWeekKey(weekKey) {
  const monday = weekKeyToMonday(weekKey);
  monday.setDate(monday.getDate() + 7);
  return getWeekKey(monday);
}

/**
 * Compares two week keys: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareWeekKeys(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
