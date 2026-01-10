import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLessons } from "@/hooks/useLessons";
import { CourseView } from "@/components/course/CourseView";
import { PracticeCoach } from "@/components/PracticeCoach";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Lesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, isPro, loading: profileLoading } = useProfile();
  const { lessons, progress, markComplete, loading: lessonsLoading, canAccessLesson } = useLessons();
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

  const isLocked = !canAccessLesson(lesson, profile?.subscription_tier || null);

  // Show locked view for non-accessible lessons
  if (isLocked) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>← Back to Dashboard</span>
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
          <Button 
            variant="default" 
            size="lg" 
            onClick={() => window.open("https://whop.com/checkout?plan=pro", "_blank")}
          >
            Upgrade to Pro
          </Button>
        </main>
      </div>
    );
  }

  // Render the Udemy-style course view
  return (
    <>
      <CourseView
        lessons={lessons}
        progress={progress}
        currentLessonId={id!}
        canAccessLesson={canAccessLesson}
        userTier={profile?.subscription_tier || null}
        markComplete={markComplete}
      />
      
      {showPractice && lesson && (
        <PracticeCoach
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          open={showPractice}
          onOpenChange={setShowPractice}
        />
      )}
    </>
  );
};

export default Lesson;
