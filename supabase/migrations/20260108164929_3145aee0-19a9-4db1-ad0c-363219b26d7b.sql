-- Add plan_access column to lessons table for subscription tier enforcement
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS plan_access text NOT NULL DEFAULT 'free' 
  CHECK (plan_access IN ('free', 'starter', 'pro', 'enterprise'));

-- Create admin_emails table for strict admin access control
CREATE TABLE IF NOT EXISTS public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'content_admin')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on admin_emails
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Only super admins can view admin emails
CREATE POLICY "Only super admins can view admin emails" 
ON public.admin_emails 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert the exact allowed admin emails
INSERT INTO public.admin_emails (email, role) VALUES 
  ('adamsproject91@gmail.com', 'super_admin'),
  ('jihadnasr042@gmail.com', 'content_admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Create activity_log table for admin notifications
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('auth', 'content', 'payment', 'system')),
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can view activity logs
CREATE POLICY "Admins can view all activity logs" 
ON public.activity_log 
FOR SELECT 
USING (is_admin(auth.uid()));

-- System can insert activity logs (via edge functions with service role)
CREATE POLICY "System can insert activity logs" 
ON public.activity_log 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster activity log queries
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON public.activity_log (action_type);

-- Create pending_upgrades table for when users pay before signing up
CREATE TABLE IF NOT EXISTS public.pending_upgrades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('starter', 'pro', 'enterprise')),
  whop_membership_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  applied_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.pending_upgrades ENABLE ROW LEVEL SECURITY;

-- Only admins can view pending upgrades
CREATE POLICY "Admins can view pending upgrades" 
ON public.pending_upgrades 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Enable realtime for activity_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;