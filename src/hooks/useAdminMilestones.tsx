import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MilestoneEvent {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  lesson_title: string;
  completed_at: string;
  type: 'lesson_complete' | 'course_complete' | 'streak';
}

export function useAdminMilestones() {
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentMilestones = useCallback(async () => {
    try {
      // Get recent lesson completions with user info
      const { data, error } = await supabase
        .from('lesson_progress')
        .select(`
          id,
          user_id,
          lesson_id,
          completed_at,
          lessons!inner(title)
        `)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch user profiles for these completions
      const userIds = [...new Set((data || []).map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const milestonesData: MilestoneEvent[] = (data || []).map(d => ({
        id: d.id,
        user_id: d.user_id,
        user_email: '',
        user_name: profileMap.get(d.user_id) || 'Unknown',
        lesson_title: (d.lessons as any)?.title || 'Unknown Lesson',
        completed_at: d.completed_at || new Date().toISOString(),
        type: 'lesson_complete' as const,
      }));

      setMilestones(milestonesData);
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentMilestones();
  }, [fetchRecentMilestones]);

  // Real-time subscription for new lesson completions
  useEffect(() => {
    const channel = supabase
      .channel('admin-milestones')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lesson_progress',
        },
        async (payload) => {
          const newProgress = payload.new as any;
          
          if (newProgress.completed) {
            // Fetch lesson and user info
            const [lessonRes, profileRes] = await Promise.all([
              supabase.from('lessons').select('title').eq('id', newProgress.lesson_id).single(),
              supabase.from('profiles').select('full_name').eq('user_id', newProgress.user_id).single(),
            ]);

            const newMilestone: MilestoneEvent = {
              id: newProgress.id,
              user_id: newProgress.user_id,
              user_email: '',
              user_name: profileRes.data?.full_name || 'Unknown',
              lesson_title: lessonRes.data?.title || 'Unknown Lesson',
              completed_at: newProgress.completed_at || new Date().toISOString(),
              type: 'lesson_complete',
            };

            setMilestones(prev => [newMilestone, ...prev].slice(0, 20));
            
            // Show toast notification in admin dashboard
            toast.success(
              `🎉 ${newMilestone.user_name} completed "${newMilestone.lesson_title}"`,
              { duration: 5000 }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lesson_progress',
        },
        async (payload) => {
          const updatedProgress = payload.new as any;
          const oldProgress = payload.old as any;
          
          // Only trigger if just became completed
          if (updatedProgress.completed && !oldProgress.completed) {
            const [lessonRes, profileRes] = await Promise.all([
              supabase.from('lessons').select('title').eq('id', updatedProgress.lesson_id).single(),
              supabase.from('profiles').select('full_name').eq('user_id', updatedProgress.user_id).single(),
            ]);

            const newMilestone: MilestoneEvent = {
              id: updatedProgress.id,
              user_id: updatedProgress.user_id,
              user_email: '',
              user_name: profileRes.data?.full_name || 'Unknown',
              lesson_title: lessonRes.data?.title || 'Unknown Lesson',
              completed_at: updatedProgress.completed_at || new Date().toISOString(),
              type: 'lesson_complete',
            };

            setMilestones(prev => [newMilestone, ...prev.filter(m => m.id !== newMilestone.id)].slice(0, 20));
            
            toast.success(
              `🎉 ${newMilestone.user_name} completed "${newMilestone.lesson_title}"`,
              { duration: 5000 }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    milestones,
    loading,
    refetch: fetchRecentMilestones,
  };
}
