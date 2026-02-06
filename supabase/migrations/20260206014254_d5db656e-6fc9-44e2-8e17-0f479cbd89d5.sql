-- Seed the admin emails with super_admin role if they don't exist
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
WHERE u.email IN ('adamsproject91@gmail.com', 'jihadnasr042@gmail.com')
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a function to get user role by email (for auth flow)
CREATE OR REPLACE FUNCTION public.get_user_role_by_email(_email text)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE LOWER(u.email) = LOWER(_email)
  LIMIT 1
$$;

-- Create a function to get user role by user_id (for auth flow)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;