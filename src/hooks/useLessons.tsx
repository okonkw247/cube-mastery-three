import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  skill_level: string;
  order_index: number;
  is_free: boolean;
  created_at: string;
  lesson_notes: string | null;
  hologram_sheet_url: string | null;
  plan_access: string | null;
  status: string | null;
}

export interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  watched_seconds: number;
  completed_at: string | null;
}

export function useLessons() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [loading, setLoading] = useState(true);

  const fetchLessons = useCallback(async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('status', 'published')
      .order('order_index', { ascending: true });

    if (!error && data) {
      setLessons(data);
    }
    setLoading(false);
  }, []);

  const fetchProgress = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      const progressMap: Record<string, LessonProgress> = {};
      data.forEach((p) => {
        progressMap[p.lesson_id] = {
          lesson_id: p.lesson_id,
          completed: p.completed,
          watched_seconds: p.watched_seconds,
          completed_at: p.completed_at,
        };
      });
      setProgress(progressMap);
    }
  }, [user]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user, fetchProgress]);

  // Real-time subscription for lesson updates (thumbnails, new lessons)
  useEffect(() => {
    const channel = supabase
      .channel('lessons-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
        },
        (payload) => {
          console.log('Lesson updated in real-time:', payload);
          if (payload.eventType === 'INSERT') {
            const newLesson = payload.new as Lesson;
            if (newLesson.status === 'published') {
              setLessons((prev) => [...prev, newLesson].sort((a, b) => a.order_index - b.order_index));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedLesson = payload.new as Lesson;
            setLessons((prev) => 
              prev.map((l) => l.id === updatedLesson.id ? updatedLesson : l)
                .filter((l) => l.status === 'published')
                .sort((a, b) => a.order_index - b.order_index)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setLessons((prev) => prev.filter((l) => l.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Real-time subscription for progress updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('progress-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_progress',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Progress updated in real-time:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const progressData = payload.new as any;
            setProgress((prev) => ({
              ...prev,
              [progressData.lesson_id]: {
                lesson_id: progressData.lesson_id,
                completed: progressData.completed,
                watched_seconds: progressData.watched_seconds,
                completed_at: progressData.completed_at,
              },
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markComplete = async (lessonId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lesson_id',
      });

    if (!error) {
      setProgress((prev) => ({
        ...prev,
        [lessonId]: {
          lesson_id: lessonId,
          completed: true,
          watched_seconds: prev[lessonId]?.watched_seconds || 0,
          completed_at: new Date().toISOString(),
        },
      }));
    }
  };

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const canAccessLesson = (lesson: Lesson, userTier: string | null): boolean => {
    if (lesson.is_free) return true;
    if (!userTier) return false;
    
    const tierHierarchy = ['free', 'starter', 'pro', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const lessonTierIndex = tierHierarchy.indexOf(lesson.plan_access || 'free');
    
    return userTierIndex >= lessonTierIndex;
  };

  return {
    lessons,
    progress,
    loading,
    completedCount,
    progressPercent,
    markComplete,
    canAccessLesson,
    refetch: fetchLessons,
  };
}
