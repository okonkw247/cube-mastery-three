import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronDown, Info, Star, Share2, Award, MessageSquare, StickyNote, FolderDown, Bell, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import AdvancedVideoPlayer from "@/components/video/AdvancedVideoPlayer";
import { DownloadButton } from "@/components/video/DownloadButton";
import { CourseSidebar } from "./CourseSidebar";
import { LessonQA } from "@/components/video/LessonQA";
import { StudentNotes } from "./StudentNotes";
import { LessonResources } from "./LessonResources";
import { CourseAnnouncements } from "./CourseAnnouncements";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  video_url: string | null;
  is_free: boolean;
  plan_access: string;
  skill_level: string;
  lesson_notes: string | null;
  hologram_sheet_url: string | null;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

interface CourseViewProps {
  lessons: Lesson[];
  progress: Record<string, LessonProgress>;
  currentLessonId: string;
  canAccessLesson: (lesson: Lesson, tier: string | null) => boolean;
  userTier: string | null;
  markComplete: (lessonId: string) => Promise<void>;
}

export function CourseView({
  lessons,
  progress,
  currentLessonId,
  canAccessLesson,
  userTier,
  markComplete,
}: CourseViewProps) {
  const navigate = useNavigate();
  const [isMarking, setIsMarking] = useState(false);
  const [activeTab, setActiveTab] = useState("lectures");
  const [showProgressPopup, setShowProgressPopup] = useState(true);

  const currentLesson = lessons.find(l => l.id === currentLessonId);
  const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
  const isCompleted = currentLesson ? progress[currentLesson.id]?.completed : false;

  const accessibleLessons = lessons.filter(l => canAccessLesson(l, userTier));
  const completedCount = Object.values(progress).filter(p => p.completed).length;
  const totalAccessible = accessibleLessons.length;
  const totalLessons = lessons.length;
  const remainingForCert = totalLessons - completedCount;

  useEffect(() => {
    if (showProgressPopup) {
      const timer = setTimeout(() => setShowProgressPopup(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showProgressPopup]);

  const handleSelectLesson = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson && !canAccessLesson(lesson, userTier)) {
      toast.error("Upgrade to Sub 20 Mastery to access this lesson");
      return;
    }
    navigate(`/lesson/${lessonId}`);
  };

  const handleComplete = async () => {
    if (!currentLesson) return;
    setIsMarking(true);
    await markComplete(currentLesson.id);
    setIsMarking(false);
    toast.success("Lesson marked as complete! ✅");

    const nextLesson = lessons[currentIndex + 1];
    if (nextLesson && canAccessLesson(nextLesson, userTier)) {
      setTimeout(() => navigate(`/lesson/${nextLesson.id}`), 1000);
    }
  };

  const handleOpenFirstIncomplete = () => {
    const firstIncomplete = lessons.find(l => !progress[l.id]?.completed && canAccessLesson(l, userTier));
    if (firstIncomplete) {
      navigate(`/lesson/${firstIncomplete.id}`);
      setShowProgressPopup(false);
    }
  };

  if (!currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lesson not found</h1>
          <Link to="/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      {/* Progress Popup */}
      {showProgressPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-primary">{completedCount} of {totalLessons}</div>
              <p className="text-lg font-medium">lessons complete</p>
              {remainingForCert > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Finish {remainingForCert} lessons to access your certificate. Open first incomplete lecture?
                </p>
              ) : (
                <p className="text-sm text-primary font-medium">🎉 You've completed all lessons! Claim your certificate.</p>
              )}
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => setShowProgressPopup(false)}>Close</Button>
                <Button onClick={handleOpenFirstIncomplete}>Open lecture</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player — full width, always top */}
      <div className="w-full bg-black">
        <AdvancedVideoPlayer
          videoUrl={currentLesson.video_url}
          title={currentLesson.title}
          lessonId={currentLesson.id}
          onComplete={() => {
            if (!isCompleted) handleComplete();
          }}
        />
      </div>

      {/* Course Info */}
      <div className="w-full px-4 sm:px-6 pt-4 pb-3 max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold leading-tight text-foreground">{currentLesson.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">by JSN Cube Mastery</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DownloadButton lessonId={currentLesson.id} videoUrl={currentLesson.video_url} title={currentLesson.title} compact />
            {!isCompleted ? (
              <Button size="sm" onClick={handleComplete} disabled={isMarking} className="gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isMarking ? "Saving..." : "Complete"}</span>
              </Button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Tab Bar — sticky */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
          <div className="flex items-center">
            <button
              onClick={() => setActiveTab("lectures")}
              className={cn(
                "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === "lectures"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Lectures
            </button>

            {/* More dropdown — contains all other tabs */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  ["qa", "notes", "resources", "announcements", "about"].includes(activeTab)
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                  More <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuItem onClick={() => setActiveTab("about")}>
                  <Info className="w-4 h-4 mr-3 text-muted-foreground" /> About this Course
                </DropdownMenuItem>
                {completedCount === totalLessons && totalLessons > 0 && (
                  <DropdownMenuItem onClick={() => navigate("/certificates")}>
                    <Award className="w-4 h-4 mr-3 text-muted-foreground" /> Course certificate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}>
                  <Share2 className="w-4 h-4 mr-3 text-muted-foreground" /> Share this Course
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab("qa")}>
                  <MessageSquare className="w-4 h-4 mr-3 text-muted-foreground" /> Q&A
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("notes")}>
                  <StickyNote className="w-4 h-4 mr-3 text-muted-foreground" /> Notes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("resources")}>
                  <FolderDown className="w-4 h-4 mr-3 text-muted-foreground" /> Resources
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("announcements")}>
                  <Bell className="w-4 h-4 mr-3 text-muted-foreground" /> Announcements
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.success("Added to favorites! ⭐")}>
                  <Heart className="w-4 h-4 mr-3 text-muted-foreground" /> Add course to favorites
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Lesson counter */}
            <span className="text-xs text-muted-foreground hidden sm:block">
              {completedCount}/{totalLessons} complete
            </span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto w-full px-0 sm:px-6 py-0 sm:py-4 flex-1">
        {activeTab === "lectures" && (
          <CourseSidebar
            lessons={lessons}
            progress={progress}
            currentLessonId={currentLessonId}
            canAccessLesson={canAccessLesson}
            userTier={userTier}
            onSelectLesson={handleSelectLesson}
            inline
          />
        )}

        {activeTab === "qa" && (
          <div className="px-4 sm:px-0">
            <LessonQA lessonId={currentLesson.id} />
          </div>
        )}

        {activeTab === "notes" && (
          <div className="px-4 sm:px-0">
            <StudentNotes lessonId={currentLesson.id} />
          </div>
        )}

        {activeTab === "resources" && (
          <div className="px-4 sm:px-0">
            <LessonResources lesson={currentLesson} userTier={userTier} />
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="px-4 sm:px-0">
            <CourseAnnouncements />
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-8 max-w-3xl px-4 sm:px-0">
            <div>
              <button onClick={() => setActiveTab("lectures")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to Lectures
              </button>
              <h2 className="text-2xl font-bold mb-4">About this Course</h2>
              <p className="text-muted-foreground leading-relaxed">
                The exact system to take you from solving in 30-40 seconds to breaking sub 20.
                20+ HD video lessons covering finger tricks, F2L efficiency, OLL shortcuts,
                PLL mastery, and full solve breakdowns.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">What you will learn</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Advanced finger tricks", "F2L efficiency & look-ahead", "OLL shortcuts", "PLL mastery", "Speed-focused practice routines", "Full solve breakdowns"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Who this course is for</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Intermediate solvers currently averaging 30-40 seconds</li>
                <li>• Cubers who want a structured path to sub 20</li>
                <li>• Anyone who already knows CFOP basics</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-6">
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {currentIndex > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prev = lessons[currentIndex - 1];
                if (canAccessLesson(prev, userTier)) navigate(`/lesson/${prev.id}`);
              }}
              disabled={!canAccessLesson(lessons[currentIndex - 1], userTier)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          ) : <div />}
          <span className="text-xs text-muted-foreground">
            Lesson {currentIndex + 1} of {totalLessons}
          </span>
          {currentIndex < totalLessons - 1 ? (
            <Button
              size="sm"
              onClick={() => {
                const next = lessons[currentIndex + 1];
                if (canAccessLesson(next, userTier)) {
                  navigate(`/lesson/${next.id}`);
                } else {
                  toast.error("Upgrade to access this lesson");
                }
              }}
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/dashboard")}>Complete Course</Button>
          )}
        </div>
      </div>
    </div>
  );
}
