-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whop_membership_id text UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'inactive';

-- Create course_access table for granular lesson access
CREATE TABLE IF NOT EXISTS public.course_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_section integer NOT NULL,
  has_access boolean NOT NULL DEFAULT false,
  granted_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, course_section)
);

-- Enable RLS on course_access
ALTER TABLE public.course_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_access
CREATE POLICY "Users can view their own course access"
ON public.course_access
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all course access"
ON public.course_access
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage course access"
ON public.course_access
FOR ALL
USING (is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_course_access_user_section ON public.course_access(user_id, course_section);
CREATE INDEX IF NOT EXISTS idx_profiles_whop_membership ON public.profiles(whop_membership_id);

-- Create webhook_logs table for debugging
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'received',
  error_message text
);

-- Enable RLS on webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
ON public.webhook_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- System can insert webhook logs
CREATE POLICY "System can insert webhook logs"
ON public.webhook_logs
FOR INSERT
WITH CHECK (true);