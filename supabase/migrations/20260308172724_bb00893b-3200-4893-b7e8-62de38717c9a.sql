
-- Video metadata table for storing processing results
CREATE TABLE public.video_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  duration_seconds numeric,
  available_resolutions text[] DEFAULT '{}',
  thumbnail_sprite_path text,
  preview_clip_path text,
  frame_count integer DEFAULT 0,
  sprite_columns integer DEFAULT 10,
  sprite_frame_interval integer DEFAULT 5,
  sprite_frame_width integer DEFAULT 160,
  sprite_frame_height integer DEFAULT 90,
  processing_status text NOT NULL DEFAULT 'pending',
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(lesson_id)
);

-- Enable RLS
ALTER TABLE public.video_metadata ENABLE ROW LEVEL SECURITY;

-- Anyone can view metadata (needed for player)
CREATE POLICY "Anyone can view video metadata"
  ON public.video_metadata FOR SELECT
  USING (true);

-- Admins can manage metadata
CREATE POLICY "Admins can manage video metadata"
  ON public.video_metadata FOR ALL
  USING (is_admin(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_metadata;
