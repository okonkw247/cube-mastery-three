import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Download, Menu, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdvancedVideoPlayer from "@/components/video/AdvancedVideoPlayer";
import { DownloadButton } from "@/components/video/DownloadButton";
import { CourseSidebar } from "./CourseSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentLesson = lessons.find(l => l.id === currentLessonId);
  const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
  const isCompleted = currentLesson ? progress[currentLesson.id]?.completed : false;

  const handleSelectLesson = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
    setSidebarOpen(false);
  };

  const handleComplete = async () => {
    if (!currentLesson) return;
    setIsMarking(true);
    await markComplete(currentLesson.id);
    setIsMarking(false);
    toast.success("Lesson marked as complete!");

    // Auto-advance to next lesson
    const nextLesson = lessons[currentIndex + 1];
    if (nextLesson && canAccessLesson(nextLesson, userTier)) {
      setTimeout(() => {
        navigate(`/lesson/${nextLesson.id}`);
      }, 1000);
    }
  };

  const handleDownloadResource = (url: string, name: string) => {
    window.open(url, "_blank");
    toast.success(`Downloading ${name}...`);
  };

  if (!currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lesson not found</h1>
          <Link to="/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = Object.values(progress).filter(p => p.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar trigger */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <CourseSidebar
                  lessons={lessons}
                  progress={progress}
                  currentLessonId={currentLessonId}
                  canAccessLesson={canAccessLesson}
                  userTier={userTier}
                  onSelectLesson={handleSelectLesson}
                />
              </SheetContent>
            </Sheet>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progressPercent}%</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <CourseSidebar
            lessons={lessons}
            progress={progress}
            currentLessonId={currentLessonId}
            canAccessLesson={canAccessLesson}
            userTier={userTier}
            onSelectLesson={handleSelectLesson}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Advanced Video Player - YouTube-style */}
            <div className="mb-6">
              <AdvancedVideoPlayer 
                videoUrl={currentLesson.video_url} 
                title={currentLesson.title}
                lessonId={currentLesson.id}
                onComplete={() => {
                  if (!isCompleted) {
                    handleComplete();
                  }
                }}
              />
            </div>

            {/* Lesson Info */}
            <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-xs sm:text-sm text-primary font-medium capitalize bg-primary/10 px-2 py-1 rounded">
                  {currentLesson.skill_level}
                </span>
                <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {currentLesson.duration || "5 min"}
                </div>
                {isCompleted && (
                  <div className="flex items-center gap-1 text-primary text-xs sm:text-sm">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    Completed
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  Lesson {currentIndex + 1} of {lessons.length}
                </span>
                <DownloadButton 
                  lessonId={currentLesson.id}
                  videoUrl={currentLesson.video_url}
                  title={currentLesson.title}
                  compact
                />
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3">
                {currentLesson.title}
              </h1>
              
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {currentLesson.description}
              </p>
            </div>

            {/* Complete Button */}
            {!isCompleted && (
              <div className="mb-6">
                <Button 
                  variant="default" 
                  onClick={handleComplete} 
                  className="gap-2"
                  disabled={isMarking}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isMarking ? "Saving..." : "Mark as Complete"}
                </Button>
              </div>
            )}

            {/* Resources Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Lesson Notes */}
              {currentLesson.lesson_notes && (
                <div className="card-gradient rounded-xl p-4 sm:p-5 border border-border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Lesson Notes
                  </h3>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-xs sm:text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg overflow-x-auto max-h-48">
                      {currentLesson.lesson_notes}
                    </pre>
                  </div>
                </div>
              )}

              {/* Downloadable Resources */}
              <div className="card-gradient rounded-xl p-4 sm:p-5 border border-border">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Download className="w-4 h-4 text-primary" />
                  Resources
                </h3>
                
                {currentLesson.hologram_sheet_url ? (
                  <button
                    onClick={() => handleDownloadResource(currentLesson.hologram_sheet_url!, "Hologram Sheet")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Hologram Sheet</p>
                      <p className="text-xs text-muted-foreground">PDF Download</p>
                    </div>
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No resources for this lesson yet.
                  </p>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              {currentIndex > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    const prevLesson = lessons[currentIndex - 1];
                    if (canAccessLesson(prevLesson, userTier)) {
                      navigate(`/lesson/${prevLesson.id}`);
                    }
                  }}
                  disabled={!canAccessLesson(lessons[currentIndex - 1], userTier)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              ) : (
                <div />
              )}

              {currentIndex < lessons.length - 1 ? (
                <Button
                  variant="default"
                  onClick={() => {
                    const nextLesson = lessons[currentIndex + 1];
                    if (canAccessLesson(nextLesson, userTier)) {
                      navigate(`/lesson/${nextLesson.id}`);
                    } else {
                      toast.error("Upgrade to access this lesson");
                    }
                  }}
                  className="gap-2"
                >
                  <span className="hidden sm:inline">Next Lesson</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
              ) : (
                <Button variant="default" onClick={() => navigate("/dashboard")} className="gap-2">
                  Complete Course
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
