import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from './useAdmin';
import { useSettingsContext } from '@/contexts/SettingsContext';

export interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  action_type: 'auth' | 'content' | 'payment' | 'system';
  details: Record<string, any>;
  created_at: string;
}

export function useActivityLog() {
  const { isAdmin } = useAdmin();
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get timezone-aware formatters from context
  const settingsContext = useSettingsContext();
  const formatActivityTime = settingsContext?.formatActivity || ((date: string) => date);
  const formatSmartTime = settingsContext?.formatSmart || ((date: string) => date);

  const fetchActivities = useCallback(async (limit = 50) => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      setActivities(data as ActivityLogEntry[]);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchActivities();

      // Subscribe to real-time updates
      const channel = supabase
        .channel('activity-log-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_log',
          },
          (payload) => {
            setActivities((prev) => [payload.new as ActivityLogEntry, ...prev.slice(0, 49)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin, fetchActivities]);

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'auth':
        return '🔐';
      case 'content':
        return '📚';
      case 'payment':
        return '💳';
      case 'system':
        return '⚙️';
      default:
        return '📝';
    }
  };

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case 'auth':
        return 'text-blue-500';
      case 'content':
        return 'text-green-500';
      case 'payment':
        return 'text-yellow-500';
      case 'system':
        return 'text-gray-500';
      default:
        return 'text-muted-foreground';
    }
  };

  // Format an activity's timestamp in user's timezone
  const formatTimestamp = useCallback((timestamp: string) => {
    return formatActivityTime(timestamp);
  }, [formatActivityTime]);

  const formatTimestampSmart = useCallback((timestamp: string) => {
    return formatSmartTime(timestamp);
  }, [formatSmartTime]);

  return {
    activities,
    loading,
    refetch: fetchActivities,
    getActivityIcon,
    getActivityColor,
    formatTimestamp,
    formatTimestampSmart,
  };
}
