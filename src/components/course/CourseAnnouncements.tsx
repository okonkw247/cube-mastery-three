import { useState, useEffect } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export function CourseAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAnnouncements(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Announcements</h3>
      </div>

      {announcements.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No announcements yet.</p>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    JSN
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">JSN Cube Mastery</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h4 className="font-bold text-base mb-2">{ann.title}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ann.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
