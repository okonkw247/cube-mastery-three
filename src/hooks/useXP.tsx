import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const XP_VALUES: Record<string, number> = {
  complete_lesson: 10,
  daily_login: 5,
  complete_course: 100,
  forum_post: 15,
  first_post_bonus: 15,
};

export function useXP() {
  const { user } = useAuth();
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchXP = useCallback(async () => {
    if (!user) { setTotalXP(0); setLoading(false); return; }
    const { data } = await supabase
      .from('xp_events')
      .select('xp_amount')
      .eq('user_id', user.id);
    if (data) setTotalXP(data.reduce((sum, e) => sum + e.xp_amount, 0));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchXP(); }, [fetchXP]);

  const awardXP = useCallback(async (action: string, referenceId?: string) => {
    if (!user) return;
    const amount = XP_VALUES[action] || 0;
    if (amount === 0) return;

    // Check for duplicate daily_login today
    if (action === 'daily_login') {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('xp_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('action', 'daily_login')
        .gte('created_at', today + 'T00:00:00Z')
        .lte('created_at', today + 'T23:59:59Z')
        .limit(1);
      if (existing && existing.length > 0) return;
    }

    // Check first post bonus
    if (action === 'forum_post') {
      const { data: prevPosts } = await supabase
        .from('xp_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('action', 'forum_post')
        .limit(1);
      
      // Award main XP
      await supabase.from('xp_events').insert({
        user_id: user.id, action, xp_amount: amount, reference_id: referenceId || null,
      });

      // First post bonus
      if (!prevPosts || prevPosts.length === 0) {
        await supabase.from('xp_events').insert({
          user_id: user.id, action: 'first_post_bonus', xp_amount: XP_VALUES.first_post_bonus, reference_id: referenceId || null,
        });
        setTotalXP(prev => prev + amount + XP_VALUES.first_post_bonus);
      } else {
        setTotalXP(prev => prev + amount);
      }
      
      // Update profile total_points
      await supabase.from('profiles').update({ total_points: totalXP + amount }).eq('user_id', user.id);
      return;
    }

    await supabase.from('xp_events').insert({
      user_id: user.id, action, xp_amount: amount, reference_id: referenceId || null,
    });
    setTotalXP(prev => prev + amount);
    await supabase.from('profiles').update({ total_points: totalXP + amount }).eq('user_id', user.id);
  }, [user, totalXP]);

  return { totalXP, loading, awardXP, refetch: fetchXP };
}
