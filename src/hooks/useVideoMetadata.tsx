import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoMetadata {
  id: string;
  lesson_id: string;
  duration_seconds: number | null;
  available_resolutions: string[];
  thumbnail_sprite_path: string | null;
  preview_clip_path: string | null;
  frame_count: number;
  sprite_columns: number;
  sprite_frame_interval: number;
  sprite_frame_width: number;
  sprite_frame_height: number;
  processing_status: string;
  processed_at: string | null;
}

export function useVideoMetadata(lessonId?: string) {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lessonId) return;

    setLoading(true);
    
    const fetchMetadata = async () => {
      const { data, error } = await supabase
        .from('video_metadata')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (!error && data) {
        setMetadata(data as unknown as VideoMetadata);
      }
      setLoading(false);
    };

    fetchMetadata();

    // Real-time updates
    const channel = supabase
      .channel(`video-metadata-${lessonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_metadata',
          filter: `lesson_id=eq.${lessonId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setMetadata(payload.new as unknown as VideoMetadata);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId]);

  return { metadata, loading };
}

/**
 * Trigger video processing after upload.
 * Call this from the admin lesson creation/edit flow.
 */
export async function triggerVideoProcessing(params: {
  lessonId: string;
  videoUrl: string;
  videoPath?: string;
  title: string;
  description?: string;
  durationSeconds?: number;
}) {
  const { data, error } = await supabase.functions.invoke('process-video', {
    body: params,
  });

  if (error) {
    console.error('Failed to trigger video processing:', error);
    throw error;
  }

  return data;
}
