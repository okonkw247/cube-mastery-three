-- Fix error 1: Add explicit deny policy for anonymous users on profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Fix error 2: The admin_invites table already has proper policies after our fixes
-- Just verify the public SELECT policy was dropped (already done in previous migration)

-- Fix error 3: Fix user_roles policy - separate user view and admin view
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;

-- Create separate policies for clarity
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));