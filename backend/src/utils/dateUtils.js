// MAK Tours & Travels ERP - Date & Calendar Utilities

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Validate that a month string matches YYYY-MM format.
 * @param {string} monthStr
 * @returns {boolean}
 */
export function validateMonth(monthStr) {
  if (typeof monthStr !== 'string') return false;
  return MONTH_REGEX.test(monthStr.trim());
}

/**
 * Get total days in a month (1-indexed month, 1..12).
 * @param {number} year
 * @param {number} monthNum - 1 to 12
 * @returns {number}
 */
export function getDaysInMonth(year, monthNum) {
  return new Date(year, monthNum, 0).getDate();
}

/**
 * Calculate scheduled working days in a month from the real calendar.
 * Excludes weekly-off days and public holidays that fall on working days (avoids double-counting).
 *
 * @param {number} year
 * @param {number} monthNum - 1 to 12
 * @param {Array<string>} weeklyOffDays - e.g. ['Sunday'] or ['Saturday', 'Sunday']
 * @param {Array<{ date: string, name?: string }>} publicHolidays - list of holiday objects with YYYY-MM-DD date
 * @returns {{ daysInMonth: number, scheduledWorkingDays: number, weeklyOffCount: number, holidayCount: number, holidaysInMonth: Array<Object> }}
 */
export function calculateScheduledWorkingDays(year, monthNum, weeklyOffDays = ['Sunday'], publicHolidays = []) {
  const daysInMonth = getDaysInMonth(year, monthNum);
  const monthPrefix = `${year}-${String(monthNum).padStart(2, '0')}`;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const normalizedOffDays = new Set((weeklyOffDays || ['Sunday']).map((d) => d.toLowerCase().trim()));

  // Filter holidays belonging to this specific month
  const holidaysInMonth = (publicHolidays || []).filter((h) => {
    return h && typeof h.date === 'string' && h.date.startsWith(monthPrefix);
  });
  const holidayDateSet = new Set(holidaysInMonth.map((h) => h.date));

  let weeklyOffCount = 0;
  let holidayCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, monthNum - 1, day);
    const dayOfWeek = dayNames[dateObj.getDay()].toLowerCase();
    const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;

    const isWeeklyOff = normalizedOffDays.has(dayOfWeek);
    const isHoliday = holidayDateSet.has(dateStr);

    if (isWeeklyOff) {
      weeklyOffCount++;
    } else if (isHoliday) {
      // Holiday falls on a working day
      holidayCount++;
    }
  }

  const scheduledWorkingDays = Math.max(0, daysInMonth - weeklyOffCount - holidayCount);

  return {
    daysInMonth,
    scheduledWorkingDays,
    weeklyOffCount,
    holidayCount,
    holidaysInMonth
  };
}

/**
 * Parse a 12h or 24h pickup time string into minutes since midnight (0..1439).
 * Handles formats like: "08:00 AM", "8:00 AM", "2:00 PM", "02:30 pm", "23:15", "05:00".
 *
 * @param {string} timeStr
 * @returns {number|null} Minutes from midnight or null if unparseable
 */
export function parsePickupTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const clean = timeStr.trim().toLowerCase();

  // 12-hour format with AM/PM (e.g., "08:00 AM", "2:30 pm", "11:45pm")
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3].toLowerCase();

    if (hours > 12 || minutes > 59) return null;
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // 24-hour format (e.g., "08:00", "14:30", "23:59")
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Determine whether a pickup time falls within the configured night shift window.
 * Default night shift: 22:00 (10:00 PM) to 06:00 (06:00 AM).
 * Handles midnight crossing correctly (start > end).
 *
 * @param {string} pickupTimeStr - e.g. "08:00 AM", "2:00 PM", "11:30 PM", "05:00 AM"
 * @param {string} nightShiftStart - e.g. "22:00"
 * @param {string} nightShiftEnd - e.g. "06:00"
 * @returns {boolean}
 */
export function isNightShift(pickupTimeStr, nightShiftStart = '22:00', nightShiftEnd = '06:00') {
  const pickupMins = parsePickupTime(pickupTimeStr);
  if (pickupMins === null) return false;

  const startMins = parsePickupTime(nightShiftStart) ?? 22 * 60; // 1320
  const endMins = parsePickupTime(nightShiftEnd) ?? 6 * 60;      // 360

  if (startMins > endMins) {
    // Window crosses midnight: e.g. 22:00 (1320) to 06:00 (360)
    // Time is night if >= 22:00 OR < 06:00
    return pickupMins >= startMins || pickupMins < endMins;
  } else {
    // Window within same calendar day: e.g. 01:00 to 05:00
    return pickupMins >= startMins && pickupMins < endMins;
  }
}

export default {
  validateMonth,
  getDaysInMonth,
  calculateScheduledWorkingDays,
  parsePickupTime,
  isNightShift
};
