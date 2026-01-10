import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserSettings {
  id: string;
  user_id: string;
  language: string;
  timezone: string;
  email_notifications: boolean;
  progress_reminders: boolean;
  marketing_emails: boolean;
  browser_notifications: boolean;
  profile_visibility: string;
  activity_tracking: boolean;
  data_sharing: boolean;
  two_step_enabled: boolean;
  support_access: boolean;
  connected_apps: string[];
  created_at: string;
  updated_at: string;
}

const defaultSettings: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  email_notifications: true,
  progress_reminders: true,
  marketing_emails: false,
  browser_notifications: false,
  profile_visibility: 'private',
  activity_tracking: true,
  data_sharing: false,
  two_step_enabled: true,
  support_access: false,
  connected_apps: [],
};

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Parse connected_apps if it's a string
        const parsedData = {
          ...data,
          connected_apps: Array.isArray(data.connected_apps) 
            ? data.connected_apps 
            : JSON.parse(data.connected_apps as string || '[]'),
        };
        setSettings(parsedData as UserSettings);
      } else {
        // Create default settings for new user
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            ...defaultSettings,
          })
          .select()
          .single();

        if (createError) throw createError;
        
        const parsedNewSettings = {
          ...newSettings,
          connected_apps: Array.isArray(newSettings.connected_apps) 
            ? newSettings.connected_apps 
            : JSON.parse(newSettings.connected_apps as string || '[]'),
        };
        setSettings(parsedNewSettings as UserSettings);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
    showToast = true
  ): Promise<boolean> => {
    if (!user || !settings) return false;

    // Optimistic update
    setSettings(prev => prev ? { ...prev, [key]: value } : null);

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (showToast) {
        toast.success('Setting saved');
      }
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      // Revert on error
      setSettings(prev => prev ? { ...prev, [key]: settings[key] } : null);
      toast.error('Failed to save setting');
      return false;
    }
  }, [user, settings]);

  const updateMultipleSettings = useCallback(async (
    updates: Partial<UserSettings>,
    showToast = true
  ): Promise<boolean> => {
    if (!user || !settings) return false;

    // Optimistic update
    setSettings(prev => prev ? { ...prev, ...updates } : null);

    try {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (showToast) {
        toast.success('Settings saved');
      }
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert on error
      await fetchSettings();
      toast.error('Failed to save settings');
      return false;
    }
  }, [user, settings, fetchSettings]);

  const toggleConnectedApp = useCallback(async (appName: string): Promise<boolean> => {
    if (!settings) return false;

    const currentApps = settings.connected_apps || [];
    const isConnected = currentApps.includes(appName);
    const newApps = isConnected 
      ? currentApps.filter(a => a !== appName)
      : [...currentApps, appName];

    const success = await updateSetting('connected_apps', newApps, false);
    
    if (success) {
      toast.success(isConnected ? `${appName} disconnected` : `${appName} connected!`);
    }
    
    return success;
  }, [settings, updateSetting]);

  return {
    settings,
    loading,
    updateSetting,
    updateMultipleSettings,
    toggleConnectedApp,
    refetch: fetchSettings,
  };
}
