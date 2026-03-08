
-- REFERRAL SYSTEM TABLES
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_email text,
  referred_user_id uuid,
  click_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'clicked',
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  paid_at timestamptz
);

CREATE UNIQUE INDEX referrals_referrer_referred_unique ON public.referrals (referrer_id, referred_email) WHERE referred_email IS NOT NULL;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update referrals" ON public.referrals FOR UPDATE USING (true);

-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;

-- GIFT SYSTEM TABLE
CREATE TABLE public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_email text NOT NULL,
  plan text NOT NULL,
  personal_message text,
  claim_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  claimed_at timestamptz,
  claimed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sent gifts" ON public.gifts FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "System can insert gifts" ON public.gifts FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update gifts" ON public.gifts FOR UPDATE USING (true);
CREATE POLICY "Anyone can view gift by token" ON public.gifts FOR SELECT USING (true);

-- DAILY CHALLENGES TABLE
CREATE TABLE public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  xp_reward integer NOT NULL DEFAULT 25,
  scheduled_date date,
  repeat_weekly boolean NOT NULL DEFAULT false,
  created_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON public.daily_challenges FOR SELECT USING (true);
CREATE POLICY "Admins can manage daily challenges" ON public.daily_challenges FOR ALL USING (is_admin(auth.uid()));

-- DAILY CHALLENGE COMPLETIONS
CREATE TABLE public.daily_challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  xp_earned integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, challenge_id, completed_at)
);

ALTER TABLE public.daily_challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions" ON public.daily_challenge_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions" ON public.daily_challenge_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CERTIFICATES TABLE
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_name text NOT NULL,
  certificate_id text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  student_name text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert certificates" ON public.certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can verify certificates" ON public.certificates FOR SELECT USING (true);

-- Add username to profiles for public profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- REFERRAL LEADERBOARD VIEW
CREATE OR REPLACE VIEW public.referral_leaderboard AS
SELECT 
  r.referrer_id as user_id,
  p.full_name,
  p.avatar_url,
  COUNT(*) FILTER (WHERE r.status = 'paid') as successful_referrals,
  COUNT(*) FILTER (WHERE r.status = 'signed_up' OR r.status = 'paid') as total_signups,
  COUNT(*) as total_clicks
FROM public.referrals r
JOIN public.profiles p ON p.user_id = r.referrer_id
GROUP BY r.referrer_id, p.full_name, p.avatar_url
ORDER BY successful_referrals DESC
LIMIT 10;

-- Enable realtime for daily challenges
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_challenge_completions;
