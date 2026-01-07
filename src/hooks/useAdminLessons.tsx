import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface LessonFormData {
  title: string;
  description: string;
  video_url: string;
  duration: string;
  skill_level: string;
  is_free: boolean;
  order_index: number;
  status: 'draft' | 'pending' | 'published';
  tags: string[];
  prerequisites: string[];
  preview_duration: number;
  video_quality: 'low' | 'medium' | 'high';
  thumbnail_url: string;
  lesson_notes: string;
  hologram_sheet_url: string;
}

export function useAdminLessons() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const createLesson = useCallback(async (data: LessonFormData) => {
    if (!user) return null;
    setSaving(true);

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        ...data,
        created_by: user.id,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast.error('Failed to create lesson: ' + error.message);
      return null;
    }

    toast.success('Lesson created successfully');
    return lesson;
  }, [user]);

  const updateLesson = useCallback(async (id: string, data: Partial<LessonFormData>) => {
    setSaving(true);

    const { error } = await supabase
      .from('lessons')
      .update(data)
      .eq('id', id);

    setSaving(false);

    if (error) {
      toast.error('Failed to update lesson: ' + error.message);
      return false;
    }

    toast.success('Lesson updated successfully');
    return true;
  }, []);

  const deleteLesson = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete lesson: ' + error.message);
      return false;
    }

    toast.success('Lesson deleted successfully');
    return true;
  }, []);

  const reorderLessons = useCallback(async (lessons: { id: string; order_index: number }[]) => {
    const updates = lessons.map(l => 
      supabase
        .from('lessons')
        .update({ order_index: l.order_index })
        .eq('id', l.id)
    );

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      toast.error('Failed to reorder lessons');
      return false;
    }

    toast.success('Lessons reordered');
    return true;
  }, []);

  const approveLesson = useCallback(async (id: string) => {
    return updateLesson(id, { status: 'published' });
  }, [updateLesson]);

  const uploadThumbnail = useCallback(async (file: File, lessonId: string) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${lessonId}/thumbnail.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload thumbnail');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(filePath);

    return publicUrl;
  }, []);

  return {
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    approveLesson,
    uploadThumbnail,
    saving,
  };
}
