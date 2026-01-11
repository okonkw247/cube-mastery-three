import { createContext, useContext, useEffect, ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserSettings, UserSettings } from '@/hooks/useUserSettings';
import { useTheme } from '@/hooks/useTheme';
import {
  formatInUserTimezone,
  formatShortDate,
  formatDateTime,
  formatTime,
  formatActivityTimestamp,
  formatSmartDate,
  formatRelativeTime,
} from '@/lib/dateFormatter';

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K], showToast?: boolean) => Promise<boolean>;
  updateMultipleSettings: (updates: Partial<UserSettings>, showToast?: boolean) => Promise<boolean>;
  toggleConnectedApp: (appName: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  // Computed values
  language: string;
  timezone: string;
  // Date formatting utilities
  formatDate: (date: string | Date, formatString?: string) => string;
  formatShort: (date: string | Date) => string;
  formatWithTime: (date: string | Date) => string;
  formatTimeOnly: (date: string | Date) => string;
  formatActivity: (date: string | Date) => string;
  formatSmart: (date: string | Date) => string;
  formatRelative: (date: string | Date) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const userSettings = useUserSettings();
  const { theme, toggleTheme } = useTheme();

  // Computed values with fallbacks
  const language = userSettings.settings?.language || 'en';
  const timezone = userSettings.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Apply language to document and i18n
  useEffect(() => {
    document.documentElement.lang = language;
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // Memoized date formatting functions that use the user's timezone
  const dateFormatters = useMemo(() => ({
    formatDate: (date: string | Date, formatString?: string) => 
      formatInUserTimezone(date, formatString, timezone),
    formatShort: (date: string | Date) => formatShortDate(date, timezone),
    formatWithTime: (date: string | Date) => formatDateTime(date, timezone),
    formatTimeOnly: (date: string | Date) => formatTime(date, timezone),
    formatActivity: (date: string | Date) => formatActivityTimestamp(date, timezone),
    formatSmart: (date: string | Date) => formatSmartDate(date, timezone),
    formatRelative: formatRelativeTime,
  }), [timezone]);

  return (
    <SettingsContext.Provider value={{
      ...userSettings,
      language,
      timezone,
      ...dateFormatters,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}
