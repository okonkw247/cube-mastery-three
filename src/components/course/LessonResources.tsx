import { useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lesson {
  id: string;
  title: string;
  lesson_notes: string | null;
  hologram_sheet_url: string | null;
  plan_access: string;
  is_free: boolean;
}

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
  description: string | null;
}

interface LessonResourcesProps {
  lesson: Lesson;
  userTier: string | null;
}

export function LessonResources({ lesson, userTier }: LessonResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const isPaid = userTier === 'paid' || userTier === 'starter' || userTier === 'pro' || userTier === 'enterprise';
  const isFreePlan = !isPaid;
  const isLockedContent = !lesson.is_free && lesson.plan_access !== 'free';

  useEffect(() => {
    supabase
      .from("resources")
      .select("*")
      .eq("lesson_id", lesson.id)
      .then(({ data }) => {
        setResources(data || []);
        setLoading(false);
      });
  }, [lesson.id]);

  if (isFreePlan && isLockedContent) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Resources are available for Sub 20 Mastery members.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const allResources: { title: string; url: string; type: string }[] = [];
  
  if (lesson.hologram_sheet_url) {
    allResources.push({ title: "Hologram Sheet", url: lesson.hologram_sheet_url, type: "PDF" });
  }
  
  resources.forEach(r => allResources.push({ title: r.title, url: r.url, type: r.type }));

  if (lesson.lesson_notes) {
    allResources.push({ title: "Lesson Notes", url: "", type: "notes" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Resources</h3>
        <span className="text-sm text-muted-foreground">({allResources.length} files)</span>
      </div>

      {allResources.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No resources for this lesson yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium mb-2">
            Lecture: {lesson.title} — {allResources.length} resource{allResources.length !== 1 ? 's' : ''}
          </div>
          {allResources.map((res, i) => (
            <button
              key={i}
              onClick={() => {
                if (res.type === 'notes') {
                  toast.info("Lesson notes are shown in the lesson view");
                } else {
                  window.open(res.url, "_blank");
                  toast.success(`Downloading ${res.title}...`);
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                {res.type === 'notes' ? <FileText className="w-5 h-5 text-primary" /> : <Download className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{res.title}</p>
                <p className="text-xs text-muted-foreground">{res.type === 'notes' ? 'Text' : res.type.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
