
-- XP ledger for gamification
CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  xp_amount integer NOT NULL DEFAULT 0,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own xp" ON public.xp_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own xp" ON public.xp_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Community forum posts
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  parent_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view posts" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Paid users can insert posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Leaderboard view: weekly top XP
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
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

-- Enable realtime on forum_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_events;
