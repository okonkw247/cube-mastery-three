import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Default timezone fallback
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Get a valid timezone or fallback to UTC
 */
function getValidTimezone(timezone?: string): string {
  if (!timezone) return DEFAULT_TIMEZONE;
  
  try {
    // Validate timezone by trying to use it
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    console.warn(`Invalid timezone "${timezone}", falling back to UTC`);
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Parse a date input into a Date object
 */
function parseDate(date: string | Date): Date | null {
  if (!date) return null;
  
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }
  
  try {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Format a date in the user's timezone
 */
export function formatInUserTimezone(
  date: string | Date,
  formatString: string = 'MMM d, yyyy h:mm a',
  timezone?: string
): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) return 'Invalid date';
  
  const tz = getValidTimezone(timezone);
  
  try {
    return formatInTimeZone(parsedDate, tz, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return format(parsedDate, formatString);
  }
}

/**
 * Format a date as a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) return 'Unknown';
  
  try {
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

/**
 * Format a date for display (short format)
 */
export function formatShortDate(date: string | Date, timezone?: string): string {
  return formatInUserTimezone(date, 'MMM d, yyyy', timezone);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date, timezone?: string): string {
  return formatInUserTimezone(date, 'MMM d, yyyy h:mm a', timezone);
}

/**
 * Format just the time
 */
export function formatTime(date: string | Date, timezone?: string): string {
  return formatInUserTimezone(date, 'h:mm a', timezone);
}

/**
 * Format a full date with day of week
 */
export function formatFullDate(date: string | Date, timezone?: string): string {
  return formatInUserTimezone(date, 'EEEE, MMMM d, yyyy', timezone);
}

/**
 * Format for activity logs and timestamps
 */
export function formatActivityTimestamp(date: string | Date, timezone?: string): string {
  return formatInUserTimezone(date, 'MMM d, h:mm a', timezone);
}

/**
 * Format for lesson/video duration display
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get current date/time in user's timezone
 */
export function getCurrentTimeInTimezone(timezone?: string): Date {
  const tz = getValidTimezone(timezone);
  return toZonedTime(new Date(), tz);
}

/**
 * Check if a date is today in the user's timezone
 */
export function isToday(date: string | Date, timezone?: string): boolean {
  const parsedDate = parseDate(date);
  if (!parsedDate) return false;
  
  const tz = getValidTimezone(timezone);
  const today = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
  const dateStr = formatInTimeZone(parsedDate, tz, 'yyyy-MM-dd');
  
  return today === dateStr;
}

/**
 * Check if a date is yesterday in the user's timezone
 */
export function isYesterday(date: string | Date, timezone?: string): boolean {
  const parsedDate = parseDate(date);
  if (!parsedDate) return false;
  
  const tz = getValidTimezone(timezone);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const yesterdayStr = formatInTimeZone(yesterday, tz, 'yyyy-MM-dd');
  const dateStr = formatInTimeZone(parsedDate, tz, 'yyyy-MM-dd');
  
  return yesterdayStr === dateStr;
}

/**
 * Format a date with smart relative formatting
 * Shows "Today", "Yesterday", or the actual date
 */
export function formatSmartDate(date: string | Date, timezone?: string): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) return 'Unknown';
  
  if (isToday(parsedDate, timezone)) {
    return `Today at ${formatTime(parsedDate, timezone)}`;
  }
  
  if (isYesterday(parsedDate, timezone)) {
    return `Yesterday at ${formatTime(parsedDate, timezone)}`;
  }
  
  return formatDateTime(parsedDate, timezone);
}
