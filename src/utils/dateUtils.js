/**
 * Date Utilities
 * Handles date parsing, formatting, and calculations
 */

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get tomorrow's date as ISO string
 */
export function getTomorrowISO() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get yesterday's date as ISO string
 */
export function getYesterdayISO() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Get a date N days from now as ISO string
 */
export function getDateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Get a date N days before today as ISO string
 */
export function getDateBeforeDays(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Check if a date is in the past (overdue)
 */
export function isDateInPast(dateISO) {
  if (!dateISO) return false;
  const date = new Date(dateISO);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if a date is today
 */
export function isDateToday(dateISO) {
  if (!dateISO) return false;
  const today = getTodayISO();
  return dateISO === today;
}

/**
 * Check if a date is in the future
 */
export function isDateInFuture(dateISO) {
  if (!dateISO) return false;
  const date = new Date(dateISO);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Get number of days between two dates
 * Positive = dateB is after dateA
 * Negative = dateB is before dateA
 */
export function daysBetween(dateAISO, dateBISO) {
  const dateA = new Date(dateAISO);
  const dateB = new Date(dateBISO);
  
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((dateB - dateA) / oneDay);
}

/**
 * Get days until a due date (negative = overdue)
 */
export function daysUntilDue(dueDateISO) {
  const today = getTodayISO();
  return daysBetween(today, dueDateISO);
}

/**
 * Format ISO date to readable string
 * @param {string} dateISO - ISO date string (YYYY-MM-DD or full ISO)
 * @param {string} format - 'short', 'long', or 'full'
 */
export function formatDate(dateISO, format = 'short') {
  if (!dateISO) return '';

  try {
    const date = new Date(dateISO);
    
    switch (format) {
      case 'short':
        // DD/MM/YYYY
        return date.toLocaleDateString('en-PK', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      
      case 'long':
        // 15 Apr 2026
        return date.toLocaleDateString('en-PK', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      
      case 'full':
        // Tuesday, 15 April 2026
        return date.toLocaleDateString('en-PK', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      
      default:
        return dateISO;
    }
  } catch (e) {
    return dateISO;
  }
}

/**
 * Format ISO date with relative text
 * Returns: "Today", "Tomorrow", "3 days ago", "15 Apr 2026"
 */
export function formatDateRelative(dateISO) {
  if (!dateISO) return '';

  const daysAway = daysUntilDue(dateISO);

  if (daysAway === 0) return 'Today';
  if (daysAway === 1) return 'Tomorrow';
  if (daysAway === -1) return 'Yesterday';

  if (daysAway > 1 && daysAway <= 7) {
    return `In ${daysAway} days`;
  }

  if (daysAway < -1 && daysAway >= -7) {
    return `${Math.abs(daysAway)} days ago`;
  }

  return formatDate(dateISO, 'long');
}

/**
 * Get first and last day of current month (ISO)
 */
export function getCurrentMonthRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0]
  };
}

/**
 * Get first and last day of previous month (ISO)
 */
export function getPreviousMonthRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0]
  };
}

/**
 * Get last N days range (ISO)
 */
export function getLastDaysRange(days = 7) {
  const endDate = getTodayISO();
  const startDate = getDateBeforeDays(days - 1);

  return { startDate, endDate };
}

/**
 * Check if a date is in the current month
 */
export function isDateInCurrentMonth(dateISO) {
  if (!dateISO) return false;

  const date = new Date(dateISO);
  const today = new Date();

  return date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is in the previous month
 */
export function isDateInPreviousMonth(dateISO) {
  if (!dateISO) return false;

  const date = new Date(dateISO);
  const today = new Date();
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1);

  return date.getMonth() === previousMonth.getMonth() && 
         date.getFullYear() === previousMonth.getFullYear();
}

/**
 * Parse ISO date back to Date object
 */
export function parseISODate(dateISO) {
  return new Date(dateISO);
}
