import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from './useAdmin';

export interface AdminStats {
  totalStudents: number;
  activeToday: number;
  lessonsUploaded: number;
  lessonsCompleted: number;
  avgPracticeTime: number;
  pendingApprovals: number;
}

export interface WeeklyActivityData {
  name: string;
  students: number;
  lessons: number;
  date: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  avatar: string | null;
  points: number;
  streak: number;
}

export interface UserWithProgress {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  subscription_status: string;
  is_suspended: boolean;
  total_points: number;
  created_at: string;
  lessons_completed: number;
  last_active: string | null;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: 'pdf' | 'video' | 'link';
  url: string;
  category: string | null;
  difficulty: string | null;
  lesson_id: string | null;
  view_count: number;
  download_count: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  duration_seconds: number;
  difficulty: string;
  points: number;
  lesson_id: string | null;
  is_active: boolean;
  created_at: string;
}

export function useAdminData() {
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    activeToday: 0,
    lessonsUploaded: 0,
    lessonsCompleted: 0,
    avgPracticeTime: 0,
    pendingApprovals: 0,
  });
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;

    // Fetch total students
    const { count: totalStudents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch lessons count
    const { count: lessonsUploaded } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true });

    // Fetch pending lessons
    const { count: pendingApprovals } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Fetch completed lessons count
    const { count: lessonsCompleted } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true);

    // Fetch average practice time
    const { data: practiceData } = await supabase
      .from('practice_attempts')
      .select('duration_seconds');

    const avgPracticeTime = practiceData?.length 
      ? Math.round(practiceData.reduce((acc, p) => acc + p.duration_seconds, 0) / practiceData.length)
      : 0;

    // Fetch active today (profiles updated today)
    const today = new Date().toISOString().split('T')[0];
    const { count: activeToday } = await supabase
      .from('lesson_progress')
      .select('user_id', { count: 'exact', head: true })
      .gte('updated_at', today);

    setStats({
      totalStudents: totalStudents || 0,
      activeToday: activeToday || 0,
      lessonsUploaded: lessonsUploaded || 0,
      lessonsCompleted: lessonsCompleted || 0,
      avgPracticeTime,
      pendingApprovals: pendingApprovals || 0,
    });
  }, [isAdmin]);

  const fetchWeeklyActivity = useCallback(async () => {
    if (!isAdmin) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData: WeeklyActivityData[] = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];

      // Count active students for this day
      const { count: studentCount } = await supabase
        .from('lesson_progress')
        .select('user_id', { count: 'exact', head: true })
        .gte('updated_at', dateStr)
        .lt('updated_at', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);

      // Count lessons completed this day
      const { count: lessonCount } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)
        .gte('completed_at', dateStr)
        .lt('completed_at', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);

      weekData.push({
        name: dayName,
        students: studentCount || 0,
        lessons: lessonCount || 0,
        date: dateStr,
      });
    }

    setWeeklyActivity(weekData);
  }, [isAdmin]);

  const fetchTopPerformers = useCallback(async () => {
    if (!isAdmin) return;

    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, total_points')
      .order('total_points', { ascending: false })
      .limit(5);

    if (data) {
      setTopPerformers(data.map(p => ({
        id: p.user_id,
        name: p.full_name || 'Unknown',
        avatar: p.avatar_url,
        points: p.total_points || 0,
        streak: 0,
      })));
    }
  }, [isAdmin]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profiles) {
      // Get lesson completion counts
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('user_id, completed')
        .eq('completed', true);

      const completionCounts: Record<string, number> = {};
      progressData?.forEach(p => {
        completionCounts[p.user_id] = (completionCounts[p.user_id] || 0) + 1;
      });

      setUsers(profiles.map(p => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        subscription_tier: p.subscription_tier,
        subscription_status: p.subscription_status || 'inactive',
        is_suspended: p.is_suspended || false,
        total_points: p.total_points || 0,
        created_at: p.created_at,
        lessons_completed: completionCounts[p.user_id] || 0,
        last_active: p.updated_at,
      })));
    }
  }, [isAdmin]);

  const fetchResources = useCallback(async () => {
    if (!isAdmin) return;

    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setResources(data as Resource[]);
    }
  }, [isAdmin]);

  const fetchChallenges = useCallback(async () => {
    if (!isAdmin) return;

    const { data } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setChallenges(data as Challenge[]);
    }
  }, [isAdmin]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchTopPerformers(),
      fetchUsers(),
      fetchResources(),
      fetchChallenges(),
      fetchWeeklyActivity(),
    ]);
    setLoading(false);
  }, [fetchStats, fetchTopPerformers, fetchUsers, fetchResources, fetchChallenges, fetchWeeklyActivity]);

  useEffect(() => {
    if (isAdmin) {
      refreshAll();
    }
  }, [isAdmin, refreshAll]);

  // Real-time subscriptions
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_progress' }, () => {
        fetchStats();
        fetchUsers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
        fetchTopPerformers();
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchStats, fetchTopPerformers, fetchUsers]);

  return {
    stats,
    topPerformers,
    users,
    resources,
    challenges,
    weeklyActivity,
    loading,
    refreshAll,
    fetchStats,
    fetchUsers,
    fetchResources,
    fetchChallenges,
    fetchWeeklyActivity,
  };
}
