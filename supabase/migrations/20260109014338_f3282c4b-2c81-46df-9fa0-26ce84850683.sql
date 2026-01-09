-- Create videos storage bucket for direct video uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true) 
ON CONFLICT DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'videos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'videos' AND public.is_admin(auth.uid()));

-- Add enterprise_inquiries notification type support
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Recreate with additional type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'type'
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'type column already has correct structure';
  END IF;
END $$;