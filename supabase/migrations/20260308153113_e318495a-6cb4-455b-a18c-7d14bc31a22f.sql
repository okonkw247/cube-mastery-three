
-- Fix security definer view - recreate as security invoker
DROP VIEW IF EXISTS public.weekly_leaderboard;

CREATE VIEW public.weekly_leaderboard WITH (security_invoker = true) AS
SELECT 
  xe.user_id,
  p.full_name,
  p.avatar_url,
  SUM(xe.xp_amount) as weekly_xp,
  p.total_points
FROM public.xp_events xe
JOIN public.profiles p ON p.user_id = xe.user_id
WHERE xe.created_at >= date_trunc('week', now())
GROUP BY xe.user_id, p.full_name, p.avatar_url, p.total_points
ORDER BY weekly_xp DESC
LIMIT 10;

-- Add SELECT policy on xp_events for leaderboard (all authenticated users can see all xp for leaderboard)
CREATE POLICY "Authenticated can view all xp for leaderboard" ON public.xp_events FOR SELECT TO authenticated USING (true);
-- Drop the old user-only policy
DROP POLICY IF EXISTS "Users can view their own xp" ON public.xp_events;
