import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface StudentNotesProps {
  lessonId: string;
}

export function StudentNotes({ lessonId }: StudentNotesProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("student_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setContent(data.content || "");
          setLastSaved(data.updated_at);
        } else {
          setContent("");
          setLastSaved(null);
        }
        setLoading(false);
      });
  }, [user, lessonId]);

  // Debounced auto-save
  useEffect(() => {
    if (!user || loading) return;
    const timer = setTimeout(async () => {
      if (content.trim() === "" && !lastSaved) return;
      setSaving(true);
      const { error } = await supabase
        .from("student_notes")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          content,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,lesson_id" });

      setSaving(false);
      if (!error) {
        setSaved(true);
        setLastSaved(new Date().toISOString());
        setTimeout(() => setSaved(false), 2000);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, user, lessonId, loading]);

  if (!user) {
    return <p className="text-center text-muted-foreground py-8">Sign in to take notes.</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">My Notes</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saving && <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>}
          {saved && <><Check className="w-3 h-3 text-primary" /> Saved</>}
          {!saving && !saved && lastSaved && (
            <span>Last saved {formatDistanceToNow(new Date(lastSaved), { addSuffix: true })}</span>
          )}
        </div>
      </div>
      <Textarea
        placeholder="Write your notes for this lesson here... They auto-save as you type."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[200px] resize-y"
      />
    </div>
  );
}
