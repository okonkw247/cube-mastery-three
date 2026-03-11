import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Menu, BookOpen, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdvancedVideoPlayer from "@/components/video/AdvancedVideoPlayer";
import { DownloadButton } from "@/components/video/DownloadButton";
import { CourseSidebar } from "./CourseSidebar";
import { LessonQA } from "@/components/video/LessonQA";
import { StudentNotes } from "./StudentNotes";
import { LessonResources } from "./LessonResources";
import { CourseAnnouncements } from "./CourseAnnouncements";
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
  const [activeTab, setActiveTab] = useState("lectures");
  const [showProgressPopup, setShowProgressPopup] = useState(true);

  const currentLesson = lessons.find(l => l.id === currentLessonId);
  const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
  const isCompleted = currentLesson ? progress[currentLesson.id]?.completed : false;

  const completedCount = Object.values(progress).filter(p => p.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const remainingForCert = lessons.length - completedCount;

  // Auto-dismiss progress popup after 5s
  useEffect(() => {
    if (showProgressPopup) {
      const timer = setTimeout(() => setShowProgressPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showProgressPopup]);

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
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
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{progressPercent}%</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Progress Popup */}
      {showProgressPopup && (
        <div className="bg-card border-b border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 animate-in slide-in-from-top-2">
          <div className="text-sm">
            <span className="font-medium">{completedCount} of {lessons.length} lessons complete</span>
            {remainingForCert > 0 && (
              <span className="text-muted-foreground ml-2">— Finish {remainingForCert} more to get your certificate</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowProgressPopup(false)}>Close</Button>
            <Button size="sm" onClick={handleOpenFirstIncomplete}>Open next lecture</Button>
          </div>
        </div>
      )}

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
          {/* Full-width Video Player */}
          <div className="w-full bg-black">
            <div className="max-w-5xl mx-auto">
              <AdvancedVideoPlayer 
                videoUrl={currentLesson.video_url} 
                title={currentLesson.title}
                lessonId={currentLesson.id}
                onComplete={() => {
                  if (!isCompleted) handleComplete();
                }}
              />
            </div>
          </div>

          {/* Course Title & Info below video */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-xs sm:text-sm text-primary font-medium capitalize bg-primary/10 px-2 py-1 rounded">
                Intermediate / Advanced
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
              <span className="text-xs text-muted-foreground">Lesson {currentIndex + 1} of {lessons.length}</span>
              <DownloadButton lessonId={currentLesson.id} videoUrl={currentLesson.video_url} title={currentLesson.title} compact />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{currentLesson.title}</h1>
            <p className="text-sm text-muted-foreground">JSN Cube Mastery</p>

            {/* Complete Button */}
            {!isCompleted && (
              <div className="mt-3">
                <Button variant="default" onClick={handleComplete} className="gap-2" disabled={isMarking}>
                  <CheckCircle2 className="w-4 h-4" />
                  {isMarking ? "Saving..." : "Mark as Complete"}
                </Button>
              </div>
            )}
          </div>

          {/* Tabs Bar */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center gap-2">
                <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start overflow-x-auto">
                  <TabsTrigger value="lectures" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                    Lectures
                  </TabsTrigger>
                  <TabsTrigger value="qa" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                    Q&A
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                    Resources
                  </TabsTrigger>
                  <TabsTrigger value="announcements" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                    Announcements
                  </TabsTrigger>
                </TabsList>

                {/* More Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setActiveTab("about")}>
                      <Info className="w-4 h-4 mr-2" />
                      About this Course
                    </DropdownMenuItem>
                    {progressPercent === 100 && (
                      <DropdownMenuItem onClick={() => navigate("/certificates")}>
                        🎓 Course certificate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(`https://www.cube-mastery.site/lesson/${currentLessonId}`);
                      toast.success("Link copied!");
                    }}>
                      📤 Share this Course
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Lectures Tab */}
              <TabsContent value="lectures" className="mt-4 pb-8">
                <CourseSidebar
                  lessons={lessons}
                  progress={progress}
                  currentLessonId={currentLessonId}
                  canAccessLesson={canAccessLesson}
                  userTier={userTier}
                  onSelectLesson={handleSelectLesson}
                  inline
                />
              </TabsContent>

              {/* Q&A Tab */}
              <TabsContent value="qa" className="mt-4 pb-8">
                <LessonQA lessonId={currentLesson.id} />
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="mt-4 pb-8">
                <StudentNotes lessonId={currentLesson.id} />
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="mt-4 pb-8">
                <LessonResources lesson={currentLesson} userTier={userTier} />
              </TabsContent>

              {/* Announcements Tab */}
              <TabsContent value="announcements" className="mt-4 pb-8">
                <CourseAnnouncements />
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="mt-4 pb-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-3">About this Course</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      The exact system to take you from solving in 30-40 seconds to breaking sub 20. 
                      20+ HD video lessons covering finger tricks, F2L efficiency, OLL shortcuts, 
                      PLL mastery, and full solve breakdowns.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">What you will learn</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Advanced finger tricks", "F2L efficiency & look-ahead", "OLL shortcuts", "PLL mastery", "Speed-focused practice routines", "Full solve breakdowns"].map(item => (
                        <li key={item} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Who this course is for</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Intermediate solvers currently averaging 30-40 seconds</li>
                      <li>• Cubers who want a structured path to sub 20</li>
                      <li>• Anyone who already knows CFOP basics</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Navigation Buttons */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
            <div className="flex items-center justify-between pt-6 border-t border-border">
              {currentIndex > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    const prevLesson = lessons[currentIndex - 1];
                    if (canAccessLesson(prevLesson, userTier)) navigate(`/lesson/${prevLesson.id}`);
                  }}
                  disabled={!canAccessLesson(lessons[currentIndex - 1], userTier)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              ) : <div />}

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
