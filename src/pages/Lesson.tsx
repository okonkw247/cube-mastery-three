import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLessons } from "@/hooks/useLessons";
import { CourseView } from "@/components/course/CourseView";
import { PracticeCoach } from "@/components/PracticeCoach";
import { toast } from "sonner";

const Lesson = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { lessons, allLessonsUnfiltered, progress, markComplete, loading: lessonsLoading, canAccessLesson } = useLessons();
  const [showPractice, setShowPractice] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Check access: if lesson exists but user can't access it, redirect to dashboard with upgrade modal
  useEffect(() => {
    if (authLoading || profileLoading || lessonsLoading || !id || !user) return;

    const lesson = allLessonsUnfiltered.find((l) => l.id === id);
    if (lesson && !canAccessLesson(lesson, profile?.subscription_tier || null)) {
      toast.error("Upgrade your plan to access this course");
      navigate("/dashboard?showUpgrade=true", { replace: true });
    }
  }, [id, allLessonsUnfiltered, profile, authLoading, profileLoading, lessonsLoading, user, canAccessLesson, navigate]);

  if (authLoading || profileLoading || lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) return null;

  const lesson = lessons.find((l) => l.id === id);
  
  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t('lessons.lessonNotFound')}</h1>
          <button onClick={() => navigate("/dashboard")} className="text-primary hover:underline">
            {t('lessons.backToDashboard')}
          </button>
        </div>
      </div>
    );
  }

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
