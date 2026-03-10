import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserPlan {
  subscription_tier: 'free' | 'paid';
  subscription_status: 'active' | 'inactive' | 'cancelled';
  whop_membership_id: string | null;
}

export function useUserPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, whop_membership_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        const rawTier = data.subscription_tier || 'free';
        const normalizedTier = (rawTier === 'starter' || rawTier === 'pro' || rawTier === 'enterprise' || rawTier === 'paid')
          ? 'paid' : 'free';
        setPlan({
          subscription_tier: normalizedTier as 'free' | 'paid',
          subscription_status: (data.subscription_status as UserPlan['subscription_status']) || 'inactive',
          whop_membership_id: data.whop_membership_id,
        });
      } else {
        setPlan({ subscription_tier: 'free', subscription_status: 'inactive', whop_membership_id: null });
      }
    } catch (err: any) {
      console.error('Error fetching user plan:', err);
      setError(err.message);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('profile-plan-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const d = payload.new as any;
          const rawTier = d.subscription_tier || 'free';
          const normalizedTier = (rawTier === 'starter' || rawTier === 'pro' || rawTier === 'enterprise' || rawTier === 'paid') ? 'paid' : 'free';
          setPlan({ subscription_tier: normalizedTier as 'free' | 'paid', subscription_status: d.subscription_status || 'inactive', whop_membership_id: d.whop_membership_id });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const isPro = plan?.subscription_tier === 'paid';
  const isFree = plan?.subscription_tier === 'free' || !plan;
  const isActive = plan?.subscription_status === 'active';

  return { plan, loading, error, refetch: fetchPlan, isPro, isStarter: false, isFree, isActive };
}
