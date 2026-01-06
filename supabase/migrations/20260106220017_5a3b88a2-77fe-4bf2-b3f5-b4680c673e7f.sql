-- Create table for storing OTP codes
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('login', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for requesting codes) but not read
CREATE POLICY "Anyone can request OTP codes"
ON public.otp_codes
FOR INSERT
WITH CHECK (true);

-- Only the system can read/verify codes (via edge function)
-- No SELECT policy for regular users

-- Create notifications table for student alerts
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_video', 'new_notes', 'new_hologram_sheet', 'announcement')),
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can insert notifications for anyone
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Add lesson_notes column to lessons table (rich text/markdown)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_notes TEXT;

-- Add hologram_sheet_url column to lessons table (PDF URL)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS hologram_sheet_url TEXT;

-- Create function to notify all users when admin creates content
CREATE OR REPLACE FUNCTION public.notify_all_users(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, reference_id)
  SELECT p.user_id, p_title, p_message, p_type, p_reference_id
  FROM public.profiles p;
END;
$$;