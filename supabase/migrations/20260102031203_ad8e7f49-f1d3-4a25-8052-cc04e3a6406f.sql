-- Create table for admin invites with special tokens
CREATE TABLE public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  role app_role NOT NULL DEFAULT 'content_admin',
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Super admins can manage invites
CREATE POLICY "Super admins can manage invites"
ON public.admin_invites
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Anyone can view an invite by token (for accepting)
CREATE POLICY "Anyone can view invite by token"
ON public.admin_invites
FOR SELECT
USING (true);

-- Add RLS policy to allow admins to view all profiles for admin purposes
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()));

-- Add policy for admins to update user suspension status
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (is_admin(auth.uid()));