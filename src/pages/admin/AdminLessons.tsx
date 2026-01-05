import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLessons } from '@/hooks/useLessons';
import { useAdminLessons } from '@/hooks/useAdminLessons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Eye, GripVertical } from 'lucide-react';
import { InlineEdit } from '@/components/admin/InlineEdit';
import { VideoPreviewModal } from '@/components/admin/VideoPreviewModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

interface SortableLessonProps {
  lesson: any;
  onPreview: (lesson: any) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => Promise<void>;
}

function SortableLesson({ lesson, onPreview, onDelete, onUpdate }: SortableLessonProps) {
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
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${lesson.is_free ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
        {lesson.is_free ? 'Free' : 'Pro'}
      </span>
      <div className="flex gap-1">
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '', description: '', video_url: '', duration: '', skill_level: 'beginner',
    is_free: false, order_index: lessons.length, status: 'published' as const,
    tags: [] as string[], prerequisites: [] as string[], preview_duration: 30,
    video_quality: 'high' as const, thumbnail_url: '',
  });

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
      setDialogOpen(false);
      refetch();
      setFormData({ ...formData, title: '', description: '', video_url: '' });
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

  const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);

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
                <div><Label>Video URL</Label><Input value={formData.video_url} onChange={e => setFormData({ ...formData, video_url: e.target.value })} placeholder="YouTube, TikTok, or direct URL" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Duration</Label><Input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g., 10:30" /></div>
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
                <div className="flex items-center gap-2"><Switch checked={formData.is_free} onCheckedChange={v => setFormData({ ...formData, is_free: v })} /><Label>Free Lesson</Label></div>
                <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving...' : 'Create Lesson'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedLessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedLessons.map(lesson => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  onPreview={setPreviewLesson}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {sortedLessons.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No lessons yet. Click "Add Lesson" to create your first lesson.
          </div>
        )}
      </div>

      {previewLesson && (
        <VideoPreviewModal open={!!previewLesson} onClose={() => setPreviewLesson(null)} videoUrl={previewLesson.video_url || ''} title={previewLesson.title} />
      )}
    </AdminLayout>
  );
}
