-- Fix the exposed admin invites issue
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.admin_invites;

-- Restrict user badges to only show own badges or for admins
DROP POLICY IF EXISTS "Users can view badges" ON public.user_badges;

CREATE POLICY "Users can view their own badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id OR is_admin(auth.uid()));