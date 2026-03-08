import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!code) { navigate("/"); return; }

    // Track the click and redirect to signup
    const trackClick = async () => {
      // Find referrer by code
      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('user_id')
        .eq('referral_code', code)
        .maybeSingle();

      if (profile) {
        const referrerId = (profile as any).user_id;
        // Store referrer in localStorage for post-signup tracking
        localStorage.setItem('referrer_id', referrerId);
        localStorage.setItem('referral_code', code);

        // Increment click or create referral record
        const { data: existing } = await supabase
          .from('referrals' as any)
          .select('id, click_count')
          .eq('referrer_id', referrerId)
          .eq('status', 'clicked')
          .is('referred_email', null)
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase.from('referrals' as any)
            .update({ click_count: ((existing[0] as any).click_count || 0) + 1 } as any)
            .eq('id', (existing[0] as any).id);
        } else {
          await supabase.from('referrals' as any).insert({
            referrer_id: referrerId,
            click_count: 1,
            status: 'clicked',
          } as any);
        }
      }

      navigate(`/auth?mode=signup&ref=${code}`);
    };

    trackClick();
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
}
