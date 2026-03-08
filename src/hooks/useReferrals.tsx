import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

export function useReferrals() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const generateReferralCode = useCallback(async () => {
    if (!user || !profile) return;
    if (profile.referral_code) {
      setReferralCode(profile.referral_code);
      return;
    }
    // Generate from username or user id
    const code = profile.username || profile.full_name?.toLowerCase().replace(/\s+/g, '') || user.id.slice(0, 8);
    const uniqueCode = `${code}-${user.id.slice(0, 4)}`;
    await supabase.from('profiles').update({ referral_code: uniqueCode } as any).eq('user_id', user.id);
    setReferralCode(uniqueCode);
  }, [user, profile]);

  const fetchReferrals = useCallback(async () => {
    if (!user) { setReferrals([]); setLoading(false); return; }
    const { data } = await supabase
      .from('referrals' as any)
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setReferrals(data as any[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      generateReferralCode();
      fetchReferrals();
    }
  }, [user, generateReferralCode, fetchReferrals]);

  const referralLink = referralCode 
    ? `${window.location.origin}/ref/${referralCode}` 
    : null;

  const clickCount = referrals.reduce((sum, r) => sum + (r.click_count || 0), 0);
  const signupCount = referrals.filter(r => r.status === 'signed_up' || r.status === 'paid').length;
  const paidCount = referrals.filter(r => r.status === 'paid').length;

  return {
    referrals,
    loading,
    referralCode,
    referralLink,
    clickCount,
    signupCount,
    paidCount,
    refetch: fetchReferrals,
  };
}
