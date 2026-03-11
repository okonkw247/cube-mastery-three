import { CheckCircle2, Lock, ChevronDown, ChevronRight, Video, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DownloadButton } from "@/components/video/DownloadButton";

interface Lesson {
  id: string;
  title: string;
  duration: string | null;
  is_free: boolean;
  plan_access: string;
  video_url?: string | null;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

interface CourseSidebarProps {
  lessons: Lesson[];
  progress: Record<string, LessonProgress>;
  currentLessonId: string;
  canAccessLesson: (lesson: Lesson, tier: string | null) => boolean;
  userTier: string | null;
  onSelectLesson: (lessonId: string) => void;
  inline?: boolean;
}

export function CourseSidebar({
  lessons,
  progress,
  currentLessonId,
  canAccessLesson,
  userTier,
  onSelectLesson,
  inline = false,
}: CourseSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    free: true,
    paid: true,
  });

  // Group lessons by plan access
  const groupedLessons = lessons.reduce((acc, lesson: any) => {
    const group = (lesson.is_free || lesson.plan_access === 'free') ? 'free' : 'paid';
    if (!acc[group]) acc[group] = [];
    acc[group].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const sectionLabels: Record<string, string> = {
    free: "Introduction",
    paid: "Sub 20 Mastery",
  };

  const getSectionProgress = (sectionLessons: Lesson[]) => {
    const completed = sectionLessons.filter(l => progress[l.id]?.completed).length;
    return { completed, total: sectionLessons.length };
  };

  // Track global lesson index
  let globalIndex = 0;

  const containerClass = inline
    ? "w-full"
    : "w-full lg:w-80 shrink-0 bg-card border-r border-border overflow-y-auto max-h-[calc(100vh-64px)]";

  return (
    <div className={containerClass}>
      {!inline && (
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Course Content
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {Object.values(progress).filter(p => p.completed).length} / {lessons.length} lessons completed
          </p>
        </div>
      )}

      <div className="divide-y divide-border">
        {Object.entries(groupedLessons).map(([section, sectionLessons]) => {
          const { completed, total } = getSectionProgress(sectionLessons);
          const isExpanded = expandedSections[section] !== false;
          const sectionStartIndex = globalIndex;

          return (
            <div key={section}>
              <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-sm">{sectionLabels[section] || section}</p>
                    <p className="text-xs text-muted-foreground">
                      {total} lessons • {completed}/{total} completed
                    </p>
                  </div>
                </div>
                <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="bg-secondary/20">
                  {sectionLessons.map((lesson, index) => {
                    const lessonNumber = sectionStartIndex + index + 1;
                    globalIndex++;
                    const isLocked = !canAccessLesson(lesson, userTier);
                    const isCompleted = progress[lesson.id]?.completed;
                    const isCurrent = lesson.id === currentLessonId;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => !isLocked && onSelectLesson(lesson.id)}
                        disabled={isLocked}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 pl-8 text-left transition-colors",
                          isCurrent && "bg-primary/10 border-l-2 border-primary",
                          !isCurrent && !isLocked && "hover:bg-secondary/50",
                          isLocked && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                          isCompleted ? "bg-primary/20 text-primary" :
                          isCurrent ? "bg-primary text-primary-foreground" :
                          isLocked ? "bg-muted text-muted-foreground" :
                          "bg-secondary text-foreground"
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isLocked ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            lessonNumber
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm truncate",
                            isCompleted && "text-muted-foreground"
                          )}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Video className="w-3 h-3" />
                            {lesson.duration || "5 min"}
                          </div>
                        </div>
                        {(lesson.is_free || lesson.plan_access === 'free') && !isLocked && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                            Free
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
