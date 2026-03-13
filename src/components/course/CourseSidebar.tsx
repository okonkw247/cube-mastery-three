import { CheckCircle2, ChevronDown, ChevronRight, Video, Download, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    free: true,
    paid: true,
  });

  // Separate free vs paid lessons
  const freeLessons = lessons.filter(l => l.is_free || l.plan_access === 'free');
  const paidLessons = lessons.filter(l => !l.is_free && l.plan_access !== 'free');
  
  // Determine if user is free tier (can't access paid)
  const isFreeUser = paidLessons.length > 0 && !canAccessLesson(paidLessons[0], userTier);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSectionProgress = (sectionLessons: Lesson[]) => {
    const completed = sectionLessons.filter(l => progress[l.id]?.completed).length;
    return { completed, total: sectionLessons.length };
  };

  const renderLessonRow = (lesson: Lesson, index: number) => {
    const isCompleted = progress[lesson.id]?.completed;
    const isCurrent = lesson.id === currentLessonId;

    return (
      <button
        key={lesson.id}
        onClick={() => onSelectLesson(lesson.id)}
        className={cn(
          "w-full flex items-start gap-3 p-3 pl-6 text-left transition-colors",
          isCurrent && "bg-primary/10 border-l-[3px] border-l-primary",
          !isCurrent && "hover:bg-secondary/50 border-l-[3px] border-l-transparent"
        )}
      >
        {/* Lesson number */}
        <span className="text-xs text-muted-foreground mt-0.5 w-4 shrink-0 text-right">{index + 1}</span>
        
        {/* Checkbox */}
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          isCompleted ? "text-primary" : "border-2 border-muted-foreground/40"
        )}>
          {isCompleted && <CheckCircle2 className="w-5 h-5 fill-primary text-primary-foreground" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm leading-snug",
            isCurrent && "font-semibold text-foreground",
            !isCurrent && isCompleted && "text-muted-foreground",
            !isCurrent && !isCompleted && "text-foreground"
          )}>
            {lesson.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Video className="w-3 h-3" />
            <span>Video</span>
            {lesson.duration && (
              <>
                <span>·</span>
                <span>{lesson.duration}</span>
              </>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderSection = (
    key: string,
    label: string,
    sectionLessons: Lesson[],
    startIndex: number
  ) => {
    if (sectionLessons.length === 0) return null;
    const { completed, total } = getSectionProgress(sectionLessons);
    const isExpanded = expandedSections[key] !== false;

    return (
      <div key={key}>
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <div className="text-left">
              <p className="font-semibold text-sm text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">
                {completed} / {total} lessons
              </p>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div>
            {sectionLessons.map((lesson, idx) => renderLessonRow(lesson, startIndex + idx))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={inline ? "w-full" : "w-full lg:w-80 shrink-0"}>
      {/* Free section */}
      {renderSection("free", "Section 1 — Introduction", freeLessons, 0)}

      {/* Paid section - only show lessons if user has access, otherwise upgrade card */}
      {isFreeUser ? (
        /* Upgrade Card for free users */
        <div className="mx-4 my-4 rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="font-semibold text-sm text-foreground">You're watching the intro</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            The full Sub 20 system is waiting — 20+ lessons, drills, algorithms and the exact method to break sub 20. Get lifetime access now.
          </p>
          <Button 
            className="w-full font-semibold"
            onClick={() => navigate("/dashboard?showUpgrade=true")}
          >
            Break Sub 20 — $24.99 →
          </Button>
          <p className="text-center text-xs text-primary mt-2 font-medium">
            Use EARLYBIRD for $19.99 🔥
          </p>
        </div>
      ) : (
        renderSection("paid", "Section 2 — Sub 20 Mastery", paidLessons, freeLessons.length)
      )}
    </div>
  );
}
