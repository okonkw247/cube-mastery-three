import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { usePushNotifications } from '@/components/pwa/PushNotifications';

const REMINDER_INTERVAL_KEY = 'smart-notif-last-reminder';
const ACHIEVEMENT_CHECK_KEY = 'smart-notif-last-achievement';
const MIN_REMINDER_HOURS = 24;
const MIN_ACHIEVEMENT_CHECK_HOURS = 6;

function getFirstName(fullName: string | null): string {
  if (!fullName) return 'there';
  return fullName.split(' ')[0] || 'there';
}

function hoursSince(timestamp: string | null): number {
  if (!timestamp) return Infinity;
  return (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
}

export function useSmartNotifications() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { permission, sendNotification } = usePushNotifications();
  const hasCheckedRef = useRef(false);

  // Check for unfinished courses and send reminder
  const checkUnfinishedCourses = useCallback(async () => {
    if (!user || permission !== 'granted') return;

    const lastReminder = localStorage.getItem(REMINDER_INTERVAL_KEY);
    if (hoursSince(lastReminder) < MIN_REMINDER_HOURS) return;

    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, watched_seconds, completed')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!progress || progress.length === 0) return;

    const lessonId = progress[0].lesson_id;
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title')
      .eq('id', lessonId)
      .maybeSingle();

    if (!lesson) return;

    const firstName = getFirstName(profile?.full_name ?? null);
    sendNotification(`Hey ${firstName}, keep going! 💪`, {
      body: `You were making great progress on "${lesson.title}". Continue where you left off!`,
      tag: `reminder-${lessonId}`,
      data: { url: `/lesson/${lessonId}` },
    });

    localStorage.setItem(REMINDER_INTERVAL_KEY, Date.now().toString());
  }, [user, profile, permission, sendNotification]);

  // Check for new achievements and congratulate
  const checkAchievements = useCallback(async () => {
    if (!user || permission !== 'granted') return;

    const lastCheck = localStorage.getItem(ACHIEVEMENT_CHECK_KEY);
    if (hoursSince(lastCheck) < MIN_ACHIEVEMENT_CHECK_HOURS) return;

    // Check recently completed lessons
    const since = new Date(Date.now() - MIN_ACHIEVEMENT_CHECK_HOURS * 60 * 60 * 1000).toISOString();

    const { data: recentCompletions } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('completed_at', since);

    if (recentCompletions && recentCompletions.length > 0) {
      const firstName = getFirstName(profile?.full_name ?? null);

      // Check total completions for milestones
      const { count } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      const milestones = [5, 10, 25, 50, 100];
      const hitMilestone = milestones.find(m => count === m);

      if (hitMilestone) {
        sendNotification(`🏆 Milestone Reached, ${firstName}!`, {
          body: `You've completed ${hitMilestone} lessons! You're becoming a cube master!`,
          tag: `milestone-${hitMilestone}`,
        });
      } else if (recentCompletions.length === 1) {
        sendNotification(`Great job, ${firstName}! 🎉`, {
          body: `You just completed a lesson. Keep the momentum going!`,
          tag: `completion-${recentCompletions[0].lesson_id}`,
        });
      }
    }

    // Check for new badges
    const { data: recentBadges } = await supabase
      .from('user_badges')
      .select('badge_name')
      .eq('user_id', user.id)
      .gte('earned_at', since)
      .limit(1);

    if (recentBadges && recentBadges.length > 0) {
      const firstName = getFirstName(profile?.full_name ?? null);
      sendNotification(`New Badge Earned, ${firstName}! 🥇`, {
        body: `You earned the "${recentBadges[0].badge_name}" badge. Check your profile!`,
        tag: `badge-${recentBadges[0].badge_name}`,
      });
    }

    localStorage.setItem(ACHIEVEMENT_CHECK_KEY, Date.now().toString());
  }, [user, profile, permission, sendNotification]);

  // Listen for new lesson notifications in real-time
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const channel = supabase
      .channel('smart-new-lessons')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as { title: string; message: string; type: string; reference_id: string | null };
          const firstName = getFirstName(profile?.full_name ?? null);

          // Personalize the notification
          let title = notif.title;
          let body = notif.message;

          if (notif.type === 'new_video') {
            title = `New lesson for you, ${firstName}! 🎬`;
            body = notif.message || 'A new lesson has been added. Check it out!';
          } else if (notif.type === 'announcement') {
            title = `📢 ${notif.title}`;
          }

          sendNotification(title, {
            body,
            tag: `notif-${Date.now()}`,
            data: notif.reference_id ? { url: `/lesson/${notif.reference_id}` } : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, permission, sendNotification]);

  // Run smart checks on mount (once per session)
  useEffect(() => {
    if (!user || !profile || hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // Delay checks to not block initial load
    const timer = setTimeout(() => {
      checkUnfinishedCourses();
      checkAchievements();
    }, 5000);

    return () => clearTimeout(timer);
  }, [user, profile, checkUnfinishedCourses, checkAchievements]);

  return { checkUnfinishedCourses, checkAchievements };
}
