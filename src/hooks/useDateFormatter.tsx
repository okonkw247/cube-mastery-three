import { useCallback } from 'react';
import { useSettingsContext } from '@/contexts/SettingsContext';
import {
  formatInUserTimezone,
  formatRelativeTime,
  formatShortDate,
  formatDateTime,
  formatTime,
  formatFullDate,
  formatActivityTimestamp,
  formatSmartDate,
  isToday,
  isYesterday,
  formatDuration,
} from '@/lib/dateFormatter';

/**
 * Hook that provides timezone-aware date formatting functions
 * Uses the user's saved timezone preference from settings
 */
export function useDateFormatter() {
  const { timezone } = useSettingsContext();

  const formatDate = useCallback(
    (date: string | Date, formatString?: string) => 
      formatInUserTimezone(date, formatString, timezone),
    [timezone]
  );

  const formatShort = useCallback(
    (date: string | Date) => formatShortDate(date, timezone),
    [timezone]
  );

  const formatWithTime = useCallback(
    (date: string | Date) => formatDateTime(date, timezone),
    [timezone]
  );

  const formatTimeOnly = useCallback(
    (date: string | Date) => formatTime(date, timezone),
    [timezone]
  );

  const formatFull = useCallback(
    (date: string | Date) => formatFullDate(date, timezone),
    [timezone]
  );

  const formatActivity = useCallback(
    (date: string | Date) => formatActivityTimestamp(date, timezone),
    [timezone]
  );

  const formatSmart = useCallback(
    (date: string | Date) => formatSmartDate(date, timezone),
    [timezone]
  );

  const checkIsToday = useCallback(
    (date: string | Date) => isToday(date, timezone),
    [timezone]
  );

  const checkIsYesterday = useCallback(
    (date: string | Date) => isYesterday(date, timezone),
    [timezone]
  );

  return {
    // The user's current timezone
    timezone,
    
    // Core formatting functions
    formatDate,
    formatShort,
    formatWithTime,
    formatTimeOnly,
    formatFull,
    formatActivity,
    formatSmart,
    
    // Relative time (doesn't need timezone)
    formatRelative: formatRelativeTime,
    
    // Duration formatting (doesn't need timezone)
    formatDuration,
    
    // Date checking utilities
    isToday: checkIsToday,
    isYesterday: checkIsYesterday,
  };
}
