import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  Bookmark,
  Timer,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLessons } from "@/hooks/useLessons";
import { useBookmarks } from "@/hooks/useBookmarks";
import VideoPlayer from "@/components/VideoPlayer";
import { PracticeCoach } from "@/components/PracticeCoach";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

const Lesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: profileLoading } = useProfile();
  const { lessons, progress, markComplete, loading: lessonsLoading } = useLessons();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isMarking, setIsMarking] = useState(false);
  const [showPractice, setShowPractice] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading || lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const lesson = lessons.find((l) => l.id === id);
  
  if (!lesson) {
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

  const currentIndex = lessons.findIndex((l) => l.id === id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  
  const isCompleted = progress[lesson.id]?.completed || false;
  const isLocked = !lesson.is_free && !isPro;

  const handleComplete = async () => {
    setIsMarking(true);
    await markComplete(lesson.id);
    setIsMarking(false);
  };

  const canNavigateTo = (targetLesson: typeof lesson | null) => {
    if (!targetLesson) return false;
    return targetLesson.is_free || isPro;
  };

  const handleUpgrade = () => {
    window.open("https://whop.com/checkout?plan=pro", "_blank");
  };

  const handleDownload = (type: string) => {
    toast.success(`${type} download started!`);
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-6 py-16 max-w-2xl text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Upgrade to Access</h1>
          <p className="text-muted-foreground mb-8">
            This lesson is part of the Pro curriculum. Upgrade to unlock all lessons and master the cube in under 30 seconds.
          </p>
          <Button variant="hero" size="lg" onClick={handleUpgrade}>
            Upgrade to Pro
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleBookmark(lesson.id)}
              className={isBookmarked(lesson.id) ? "text-primary" : "text-muted-foreground"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked(lesson.id) ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPractice(true)}
              className="text-muted-foreground hover:text-primary"
            >
              <Timer className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Lesson {currentIndex + 1} of {lessons.length}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Video Player */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-card mb-8">
          <VideoPlayer videoUrl={lesson.video_url} title={lesson.title} />
        </div>

        {/* Lesson Info */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-primary font-medium capitalize">{lesson.skill_level}</span>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                {lesson.duration}
              </div>
              {isCompleted && (
                <div className="flex items-center gap-1 text-primary text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {lesson.description}
            </p>

            {!isCompleted && (
              <Button 
                variant="default" 
                onClick={handleComplete} 
                className="gap-2"
                disabled={isMarking}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isMarking ? "Saving..." : "Mark as Complete"}
              </Button>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0 space-y-4">
            {/* Lesson Notes Section */}
            {lesson.lesson_notes && (
              <div className="card-gradient rounded-2xl p-6 border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  Lesson Notes
                </h3>
                <div className="prose prose-sm prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-secondary/50 p-4 rounded-lg overflow-x-auto">
                    {lesson.lesson_notes}
                  </pre>
                </div>
              </div>
            )}

            {/* Resources Section */}
            <div className="card-gradient rounded-2xl p-6 border border-border sticky top-24">
              <h3 className="font-semibold mb-4">Resources</h3>
              
              {lesson.hologram_sheet_url ? (
                <a 
                  href={lesson.hologram_sheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <Download className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Hologram Sheet</p>
                    <p className="text-xs text-muted-foreground">PDF Download</p>
                  </div>
                </a>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No resources available for this lesson yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          {prevLesson && canNavigateTo(prevLesson) ? (
            <Button
              variant="outline"
              onClick={() => navigate(`/lesson/${prevLesson.id}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Lesson
            </Button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            canNavigateTo(nextLesson) ? (
              <Button
                variant="default"
                onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                className="gap-2"
              >
                Next Lesson
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="default" className="gap-2" onClick={handleUpgrade}>
                <Lock className="w-4 h-4" />
                Upgrade to Continue
              </Button>
            )
          ) : (
            <Button variant="default" onClick={() => navigate("/dashboard")} className="gap-2">
              Back to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
      <PracticeCoach
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        open={showPractice}
        onOpenChange={setShowPractice}
      />
    </div>
  );
};

export default Lesson;
