import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CourseAccessResult {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
}

export function useCourseAccess(sectionNumber: number): CourseAccessResult {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (!user) {
      // Not logged in - check if section is in free tier (1-3)
      setHasAccess(sectionNumber >= 1 && sectionNumber <= 3);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('course_access')
        .select('has_access')
        .eq('user_id', user.id)
        .eq('course_section', sectionNumber)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setHasAccess(data?.has_access ?? false);
    } catch (err: any) {
      console.error('Error checking course access:', err);
      setError(err.message);
      // Default to free tier access on error
      setHasAccess(sectionNumber >= 1 && sectionNumber <= 3);
    } finally {
      setLoading(false);
    }
  }, [user, sectionNumber]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { hasAccess, loading, error };
}

// Hook to get all accessible sections for a user
export function useAllCourseAccess() {
  const { user } = useAuth();
  const [accessibleSections, setAccessibleSections] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccess = useCallback(async () => {
    if (!user) {
      // Not logged in - only free tier sections
      setAccessibleSections([1, 2, 3]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('course_access')
        .select('course_section')
        .eq('user_id', user.id)
        .eq('has_access', true)
        .order('course_section', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        setAccessibleSections(data.map(d => d.course_section));
      } else {
        // Default to free tier if no access records
        setAccessibleSections([1, 2, 3]);
      }
    } catch (err: any) {
      console.error('Error fetching course access:', err);
      setError(err.message);
      setAccessibleSections([1, 2, 3]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('course-access-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_access',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAccess]);

  const canAccessSection = useCallback(
    (section: number) => accessibleSections.includes(section),
    [accessibleSections]
  );

  return {
    accessibleSections,
    loading,
    error,
    refetch: fetchAccess,
    canAccessSection,
  };
}
