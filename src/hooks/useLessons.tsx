import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration: string | null;
  skill_level: string;
  order_index: number;
  is_free: boolean;
  created_at: string;
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

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data) {
      setLessons(data);
    }
    setLoading(false);
  };

  const fetchProgress = async () => {
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
  };

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

  return {
    lessons,
    progress,
    loading,
    completedCount,
    progressPercent,
    markComplete,
    refetch: fetchLessons,
  };
}
