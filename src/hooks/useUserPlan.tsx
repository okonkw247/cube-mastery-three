import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserPlan {
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise';
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

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setPlan({
          subscription_tier: (data.subscription_tier as UserPlan['subscription_tier']) || 'free',
          subscription_status: (data.subscription_status as UserPlan['subscription_status']) || 'inactive',
          whop_membership_id: data.whop_membership_id,
        });
      } else {
        // Default to free if no profile exists
        setPlan({
          subscription_tier: 'free',
          subscription_status: 'inactive',
          whop_membership_id: null,
        });
      }
    } catch (err: any) {
      console.error('Error fetching user plan:', err);
      setError(err.message);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-plan-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setPlan({
            subscription_tier: newData.subscription_tier || 'free',
            subscription_status: newData.subscription_status || 'inactive',
            whop_membership_id: newData.whop_membership_id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isPro = plan?.subscription_tier === 'pro' || plan?.subscription_tier === 'enterprise';
  const isStarter = plan?.subscription_tier === 'starter';
  const isFree = plan?.subscription_tier === 'free' || !plan;
  const isActive = plan?.subscription_status === 'active';

  return {
    plan,
    loading,
    error,
    refetch: fetchPlan,
    isPro,
    isStarter,
    isFree,
    isActive,
  };
}
