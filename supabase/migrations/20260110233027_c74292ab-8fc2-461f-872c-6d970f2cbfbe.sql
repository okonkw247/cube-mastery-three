-- Create user_settings table for persisting all user preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Language & Time
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  -- Notifications
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  progress_reminders BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  browser_notifications BOOLEAN NOT NULL DEFAULT false,
  -- Privacy
  profile_visibility TEXT NOT NULL DEFAULT 'private',
  activity_tracking BOOLEAN NOT NULL DEFAULT true,
  data_sharing BOOLEAN NOT NULL DEFAULT false,
  -- Security
  two_step_enabled BOOLEAN NOT NULL DEFAULT true,
  support_access BOOLEAN NOT NULL DEFAULT false,
  -- Plugins/Connected Apps (stored as JSON array)
  connected_apps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();