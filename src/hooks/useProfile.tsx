import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'paid';
  subscription_status: 'active' | 'inactive' | 'payment_pending' | 'payment_failed' | 'cancelled';
  whop_membership_id: string | null;
  total_points: number;
  onboarding_completed: boolean;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
  referral_code: string | null;
  referred_by: string | null;
  username: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      // Normalize old tier values to new system
      const rawTier = (data as any).subscription_tier || 'free';
      const normalizedTier = (rawTier === 'starter' || rawTier === 'pro' || rawTier === 'enterprise' || rawTier === 'paid')
        ? 'paid' : 'free';
      setProfile({ ...data, subscription_tier: normalizedTier } as Profile);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user, fetchProfile]);

  // Real-time subscription for profile changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated in real-time:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const rawTier = (payload.new as any).subscription_tier || 'free';
            const normalizedTier = (rawTier === 'starter' || rawTier === 'pro' || rawTier === 'enterprise' || rawTier === 'paid')
              ? 'paid' : 'free';
            setProfile({ ...payload.new, subscription_tier: normalizedTier } as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isPro = profile?.subscription_tier === 'paid';
  const isStarter = false; // No longer exists
  const isFree = profile?.subscription_tier === 'free' || !profile;
  const isActive = profile?.subscription_status === 'active';
  const isPaymentPending = profile?.subscription_status === 'payment_pending';
  const isPaymentFailed = profile?.subscription_status === 'payment_failed';
  const isCancelled = profile?.subscription_status === 'cancelled';

  return {
    profile,
    loading,
    isPro,
    isStarter,
    isFree,
    isActive,
    isPaymentPending,
    isPaymentFailed,
    isCancelled,
    refetch: fetchProfile,
  };
}
