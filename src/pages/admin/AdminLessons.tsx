import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { triggerVideoProcessing } from '@/hooks/useVideoMetadata';
import { useLessons } from '@/hooks/useLessons';
import { useAdminLessons } from '@/hooks/useAdminLessons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Eye, GripVertical, FileText, Download, Edit, Upload, Video, ImageIcon, Clock } from 'lucide-react';
import { useVideoDuration } from '@/hooks/useVideoDuration';
import { ThumbnailUploader } from '@/components/admin/ThumbnailUploader';
import { InlineEdit } from '@/components/admin/InlineEdit';
import { VideoPreviewModal } from '@/components/admin/VideoPreviewModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SortableLessonProps {
  lesson: any;
  onPreview: (lesson: any) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  onEdit: (lesson: any) => void;
}

function SortableLesson({ lesson, onPreview, onDelete, onUpdate, onEdit }: SortableLessonProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors ${isDragging ? 'z-50 shadow-lg' : ''}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
    <div className="flex-1 min-w-0">
        <InlineEdit 
          value={lesson.title} 
          onSave={v => onUpdate(lesson.id, { title: v })} 
          className="font-medium" 
        />
        <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
        <div className="flex gap-2 mt-1">
          {!lesson.thumbnail_url && (
            <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> No Thumbnail
            </span>
          )}
          {lesson.lesson_notes && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Notes
            </span>
          )}
          {lesson.hologram_sheet_url && (
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 flex items-center gap-1">
              <Download className="w-3 h-3" /> Hologram
            </span>
          )}
        </div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${
        lesson.is_free || lesson.plan_access === 'free' ? 'bg-green-500/10 text-green-500' :
        lesson.plan_access === 'starter' ? 'bg-blue-500/10 text-blue-500' :
        lesson.plan_access === 'pro' ? 'bg-amber-500/10 text-amber-500' :
        'bg-purple-500/10 text-purple-500'
      }`}>
        {lesson.is_free || lesson.plan_access === 'free' ? 'Free' :
         lesson.plan_access === 'starter' ? 'Starter' :
         lesson.plan_access === 'pro' ? 'Pro' : 'Enterprise'}
      </span>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(lesson)} title="Edit lesson">
          <Edit className="w-4 h-4" />
        </Button>
        {lesson.video_url && (
          <Button variant="ghost" size="icon" onClick={() => onPreview(lesson)}>
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onDelete(lesson.id)}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminLessons() {
  const { lessons, refetch } = useLessons();
  const { createLesson, updateLesson, deleteLesson, reorderLessons, saving } = useAdminLessons();
  const { detectDuration } = useVideoDuration();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [previewLesson, setPreviewLesson] = useState<any>(null);
  const [uploadingHologram, setUploadingHologram] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [detectingDuration, setDetectingDuration] = useState(false);
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '', description: '', video_url: '', duration: '', skill_level: 'beginner',
    is_free: false, order_index: lessons.length, status: 'published' as const,
    tags: [] as string[], prerequisites: [] as string[], preview_duration: 30,
    video_quality: 'high' as const, thumbnail_url: '', lesson_notes: '', hologram_sheet_url: '',
    plan_access: 'free' as string,
  });
  const [editFormData, setEditFormData] = useState({
    lesson_notes: '',
    hologram_sheet_url: '',
    video_url: '',
  });

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video must be under 500MB');
      return;
    }

    setUploadingVideo(true);

    // Auto-detect duration from the file
    let detectedDuration = '';
    try {
      setDetectingDuration(true);
      detectedDuration = await detectDuration(file);
    } catch (err) {
      console.warn('Could not detect duration:', err);
    } finally {
      setDetectingDuration(false);
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { error } = await supabase.storage
      .from('videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Video upload error:', error);
      toast.error('Failed to upload video');
      setUploadingVideo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
    
    if (isEdit) {
      setEditFormData({ ...editFormData, video_url: urlData.publicUrl });
      // If editing and we detected duration, update the lesson directly
      if (detectedDuration && editingLesson) {
        await updateLesson(editingLesson.id, { duration: detectedDuration });
      }
    } else {
      setFormData({ ...formData, video_url: urlData.publicUrl, duration: detectedDuration || formData.duration });
    }
    
    setUploadingVideo(false);
    toast.success(`Video uploaded!${detectedDuration ? ` Duration: ${detectedDuration}` : ''}`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lessons.findIndex(l => l.id === active.id);
    const newIndex = lessons.findIndex(l => l.id === over.id);
    const reordered = arrayMove(lessons, oldIndex, newIndex);

    const updates = reordered.map((lesson, index) => ({ id: lesson.id, order_index: index }));
    await reorderLessons(updates);
    refetch();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createLesson(formData);
    if (result) {
      // Notify all users about new lesson
      await supabase.rpc('notify_all_users', {
        p_title: 'New Lesson Available!',
        p_message: `"${formData.title}" has been added. Check it out now!`,
        p_type: 'new_lesson',
        p_reference_id: result.id,
      });

      // Trigger video processing pipeline if video was uploaded
      if (formData.video_url) {
        // Parse duration to seconds
        let durationSec: number | undefined;
        if (formData.duration) {
          const parts = formData.duration.split(':').map(Number);
          if (parts.length === 3) durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
          else if (parts.length === 2) durationSec = parts[0] * 60 + parts[1];
        }

        triggerVideoProcessing({
          lessonId: result.id,
          videoUrl: formData.video_url,
          title: formData.title,
          description: formData.description,
          durationSeconds: durationSec,
        }).then(() => {
          toast.success('Video processing started — AI thumbnails generating...');
        }).catch((err) => {
          console.error('Video processing trigger failed:', err);
        });
      }

      setDialogOpen(false);
      refetch();
      setFormData({ ...formData, title: '', description: '', video_url: '', lesson_notes: '', hologram_sheet_url: '' });
      toast.success('Lesson created and students notified!');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this lesson?')) {
      await deleteLesson(id);
      refetch();
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    await updateLesson(id, data);
    refetch();
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setEditFormData({
      lesson_notes: lesson.lesson_notes || '',
      hologram_sheet_url: lesson.hologram_sheet_url || '',
      video_url: lesson.video_url || '',
    });
    setEditDialogOpen(true);
  };

  const handleHologramUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploadingHologram(true);
    const fileName = `${Date.now()}-${file.name}`;
    
    const { error } = await supabase.storage
      .from('resources')
      .upload(`hologram-sheets/${fileName}`, file);

    if (error) {
      toast.error('Failed to upload hologram sheet');
      setUploadingHologram(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('resources').getPublicUrl(`hologram-sheets/${fileName}`);
    setEditFormData({ ...editFormData, hologram_sheet_url: urlData.publicUrl });
    setUploadingHologram(false);
    toast.success('Hologram sheet uploaded!');
  };

  const handleSaveEdit = async () => {
    if (!editingLesson) return;
    
    await updateLesson(editingLesson.id, editFormData);
    
    // Notify users if content was updated
    const hasNewVideo = editFormData.video_url !== editingLesson.video_url && editFormData.video_url;
    const hasNewNotes = editFormData.lesson_notes !== editingLesson.lesson_notes;
    const hasNewHologram = editFormData.hologram_sheet_url !== editingLesson.hologram_sheet_url;
    
    if (hasNewVideo) {
      await supabase.rpc('notify_all_users', {
        p_title: 'New Video Available!',
        p_message: `"${editingLesson.title}" has a new video. Watch it now!`,
        p_type: 'new_video',
        p_reference_id: editingLesson.id,
      });
    } else if (hasNewNotes || hasNewHologram) {
      await supabase.rpc('notify_all_users', {
        p_title: 'Lesson Updated!',
        p_message: `"${editingLesson.title}" has new content. Check it out!`,
        p_type: hasNewHologram ? 'new_hologram_sheet' : 'new_notes',
        p_reference_id: editingLesson.id,
      });
    }
    
    setEditDialogOpen(false);
    setEditingLesson(null);
    refetch();
    toast.success('Lesson updated and students notified!');
  };

  const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);
  const filteredLessons = planFilter === 'all' ? sortedLessons : sortedLessons.filter(l => {
    if (planFilter === 'free') return l.is_free || l.plan_access === 'free';
    return l.plan_access === planFilter;
  });
  const planCounts = {
    all: sortedLessons.length,
    free: sortedLessons.filter(l => l.is_free || l.plan_access === 'free').length,
    starter: sortedLessons.filter(l => l.plan_access === 'starter').length,
    pro: sortedLessons.filter(l => l.plan_access === 'pro').length,
    enterprise: sortedLessons.filter(l => l.plan_access === 'enterprise').length,
  };

  return (
    <AdminLayout requiredPermission="manage_lessons">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Lessons Management</h1>
            <p className="text-muted-foreground">Drag and drop to reorder lessons</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Lesson</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New Lesson</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Title</Label><Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                <div><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                
                {/* Thumbnail Uploader with AI Generation */}
                <ThumbnailUploader
                  value={formData.thumbnail_url}
                  onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
                  lessonTitle={formData.title}
                  lessonDescription={formData.description}
                  required={true}
                />
                
                <div>
                  <Label>Video</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        value={formData.video_url} 
                        onChange={e => setFormData({ ...formData, video_url: e.target.value })} 
                        placeholder="Paste URL or upload below" 
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="new-video-upload" className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                      </Label>
                      <Input
                        id="new-video-upload"
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleVideoUpload(e, false)}
                        disabled={uploadingVideo}
                        className="hidden"
                      />
                      <span className="text-xs text-muted-foreground">Max 500MB</span>
                    </div>
                    {formData.video_url && formData.video_url.includes('supabase') && (
                      <div className="flex items-center gap-2 text-xs text-green-500">
                        <Video className="w-3 h-3" /> Video will play directly on site
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1.5">
                      Duration
                      {detectingDuration && <Clock className="w-3 h-3 animate-spin text-primary" />}
                    </Label>
                    <Input 
                      value={formData.duration} 
                      onChange={e => setFormData({ ...formData, duration: e.target.value })} 
                      placeholder={detectingDuration ? "Detecting..." : "Auto-detected on upload"} 
                      readOnly={detectingDuration}
                      className={formData.duration ? "border-primary/30" : ""}
                    />
                    {formData.duration && <p className="text-[10px] text-primary mt-0.5">Auto-detected from video</p>}
                  </div>
                  <div><Label>Skill Level</Label>
                    <Select value={formData.skill_level} onValueChange={v => setFormData({ ...formData, skill_level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Plan Access</Label>
                  <Select value={formData.is_free ? 'free' : (formData as any).plan_access || 'free'} onValueChange={v => {
                    if (v === 'free') {
                      setFormData({ ...formData, is_free: true, plan_access: 'free' } as any);
                    } else {
                      setFormData({ ...formData, is_free: false, plan_access: v } as any);
                    }
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free (everyone)</SelectItem>
                      <SelectItem value="starter">Starter+</SelectItem>
                      <SelectItem value="pro">Pro+</SelectItem>
                      <SelectItem value="enterprise">Enterprise only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formData.is_free ? 'Visible to all users' : `Visible to ${(formData as any).plan_access || 'free'} and above`}
                  </p>
                </div>
                <Button type="submit" disabled={saving || !formData.thumbnail_url} className="w-full">
                  {saving ? 'Saving...' : !formData.thumbnail_url ? 'Thumbnail Required' : 'Create Lesson'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Plan Filter Tabs */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-4 overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'free', label: 'Free' },
            { key: 'starter', label: 'Starter' },
            { key: 'pro', label: 'Pro' },
            { key: 'enterprise', label: 'Enterprise' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setPlanFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                planFilter === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label} ({planCounts[tab.key as keyof typeof planCounts]})
            </button>
          ))}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredLessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredLessons.map(lesson => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  onPreview={setPreviewLesson}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onEdit={handleEditLesson}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {filteredLessons.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {planFilter === 'all' ? 'No lessons yet. Click "Add Lesson" to create your first lesson.' : `No ${planFilter} lessons yet.`}
          </div>
        )}
      </div>

      {/* Edit Lesson Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lesson: {editingLesson?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                <Video className="w-4 h-4" /> Video
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a video directly or paste an external URL
              </p>
              <div className="space-y-3">
                <Input 
                  value={editFormData.video_url} 
                  onChange={e => setEditFormData({ ...editFormData, video_url: e.target.value })} 
                  placeholder="Video URL (or upload below)"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-video-upload" className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploadingVideo ? 'Uploading...' : 'Upload New Video'}
                  </Label>
                  <Input
                    id="edit-video-upload"
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleVideoUpload(e, true)}
                    disabled={uploadingVideo}
                    className="hidden"
                  />
                  <span className="text-xs text-muted-foreground">Max 500MB</span>
                </div>
                {editFormData.video_url && editFormData.video_url.includes('supabase') && (
                  <div className="flex items-center gap-2 text-xs text-green-500">
                    <Video className="w-3 h-3" /> Video will play directly on site
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Lesson Notes</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Write notes that students will see when they view this lesson
              </p>
              <Textarea
                value={editFormData.lesson_notes}
                onChange={e => setEditFormData({ ...editFormData, lesson_notes: e.target.value })}
                placeholder="Enter lesson notes, algorithms, tips, etc..."
                className="min-h-[200px] font-mono"
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Hologram Sheet (PDF)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a PDF file that students can download
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleHologramUpload}
                  disabled={uploadingHologram}
                  className="flex-1"
                />
                {uploadingHologram && <span className="text-sm text-muted-foreground">Uploading...</span>}
              </div>
              {editFormData.hologram_sheet_url && (
                <div className="mt-2 p-3 bg-secondary/50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {editFormData.hologram_sheet_url.split('/').pop()}
                  </span>
                  <a
                    href={editFormData.hologram_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Preview
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {previewLesson && (
        <VideoPreviewModal open={!!previewLesson} onClose={() => setPreviewLesson(null)} videoUrl={previewLesson.video_url || ''} title={previewLesson.title} />
      )}
    </AdminLayout>
  );
}