import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useUserSettings, UserSettings } from '@/hooks/useUserSettings';
import { useTheme } from '@/hooks/useTheme';

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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const userSettings = useUserSettings();
  const { theme, toggleTheme } = useTheme();

  // Computed values with fallbacks
  const language = userSettings.settings?.language || 'en';
  const timezone = userSettings.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Apply language to document
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <SettingsContext.Provider value={{
      ...userSettings,
      language,
      timezone,
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
