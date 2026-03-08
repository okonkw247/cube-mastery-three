import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Play,
  Lock,
  CheckCircle2,
  Clock,
  Download,
  LogOut,
  ChevronRight,
  Calendar,
  Settings,
  Trash2,
  Edit3,
  Plus,
  Bookmark,
  Timer,
  TrendingUp,
  Shield,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLessons } from "@/hooks/useLessons";
import { useBookmarks } from "@/hooks/useBookmarks";
import { usePracticeAttempts } from "@/hooks/usePracticeAttempts";
import { useAdmin } from "@/hooks/useAdmin";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import TodoModal from "@/components/modals/TodoModal";
import InviteFriendModal from "@/components/modals/InviteFriendModal";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PracticeCoach } from "@/components/PracticeCoach";
import { StreakTracker } from "@/components/dashboard/StreakTracker";
import { BookmarkedLessons } from "@/components/dashboard/BookmarkedLessons";
import { InvitationTracker } from "@/components/dashboard/InvitationTracker";
import { NotificationBell } from "@/components/NotificationBell";
import { SubscriptionStatusBadge, PlanBadge } from "@/components/dashboard/SubscriptionStatusBadge";
import { DownloadManager } from "@/components/dashboard/DownloadManager";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface TodoItem {
  id: number;
  title: string;
  date: string;
  urgent: boolean;
  done: boolean;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, isPro, loading: profileLoading } = useProfile();
  const { lessons, progress, progressPercent, completedCount, loading: lessonsLoading, canAccessLesson } = useLessons();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { totalAttempts, attempts } = usePracticeAttempts();
  const { isAdmin, isPreviewMode, setPreviewMode } = useAdmin();
  const [chartPeriod, setChartPeriod] = useState("Year");
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [practiceLesson, setPracticeLesson] = useState<{ id: string; title: string } | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 1, title: "Complete F2L algorithms practice", date: new Date().toISOString().slice(0, 19).replace("T", " "), urgent: true, done: false },
    { id: 2, title: "Watch OLL lesson video", date: new Date().toISOString().slice(0, 19).replace("T", " "), urgent: false, done: true },
    { id: 3, title: "Practice blind solving", date: new Date().toISOString().slice(0, 19).replace("T", " "), urgent: false, done: false },
  ]);

  // Build real chart data from progress and attempts
  const chartData = (() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    return months.map((month, index) => {
      const monthAttempts = attempts.filter((a) => {
        const d = new Date(a.completed_at);
        return d.getMonth() === index && d.getFullYear() === now.getFullYear();
      }).length;
      const completedInMonth = Object.values(progress).filter((p) => {
        if (!p.completed_at) return false;
        const d = new Date(p.completed_at);
        return d.getMonth() === index && d.getFullYear() === now.getFullYear();
      }).length;
      return { month, progress: (completedInMonth + monthAttempts) * 10 };
    });
  })();

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !profileLoading) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_complete_${user.id}`);
      if (!hasCompletedOnboarding && !profile?.full_name) {
        setShowOnboarding(true);
      }
    }
  }, [user, profile, profileLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    setPreviewMode(false); // Exit preview mode on sign out
    await signOut();
    navigate("/");
  };

  const handleBackToAdmin = () => {
    setPreviewMode(false);
    navigate("/admin");
  };

  const handleToggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
    toast.success(t('dashboard.taskUpdated'));
  };

  const handleDeleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
    toast.success(t('dashboard.taskDeleted'));
  };

  const handleSaveTodo = (todo: Omit<TodoItem, "id"> & { id?: number }) => {
    if (todo.id) {
      setTodos(todos.map(t => t.id === todo.id ? { ...t, ...todo } : t));
      toast.success(t('dashboard.taskUpdated'));
    } else {
      setTodos([...todos, { ...todo, id: Date.now() }]);
      toast.success(t('dashboard.taskAdded'));
    }
    setEditingTodo(null);
  };

  const handleDownload = (name: string) => {
    toast.success(t('common.downloading', { name }));
  };

  const scrollToPricing = () => {
    navigate("/#pricing");
  };

  if (authLoading || profileLoading || lessonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) return null;

  const isEmailVerified = user.email_confirmed_at != null;
  const displayName = profile?.full_name || user.email?.split("@")[0] || "Cuber";

  return (
    <div className="min-h-screen bg-background">
      {!isEmailVerified && user.email && <EmailVerificationBanner email={user.email} />}

      {/* Admin Preview Banner */}
      {isAdmin && isPreviewMode && (
        <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm flex items-center justify-center gap-3">
          <Shield className="w-4 h-4" />
          <span>{t('dashboard.adminPreviewMode')}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBackToAdmin}
            className="ml-2"
          >
            {t('dashboard.backToAdmin')}
          </Button>
        </div>
      )}

      {/* Header - Responsive */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <LogoWithGlow size="md" />
            <span className="text-lg sm:text-xl font-bold text-foreground hidden xs:inline">{t('common.cubeMastery')}</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex text-xs sm:text-sm gap-1.5"
              onClick={() => setInviteModalOpen(true)}
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t('common.inviteFriends')}
            </Button>
            {!isPro && !isPreviewMode && (
              <Button variant="default" size="sm" className="hidden md:flex text-xs sm:text-sm" onClick={scrollToPricing}>
                {t('common.upgradeToPro')}
              </Button>
            )}
            <NotificationBell />
            <ThemeToggle />
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"><Settings className="w-4 h-4" /></Button>
            </Link>
            <button onClick={handleSignOut} className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">{t('common.signOut')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Welcome Section - Responsive */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PlanBadge />
            <SubscriptionStatusBadge />
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-4">
            {t('dashboard.welcomeBack', { name: displayName })}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-6 px-2">
            {t('dashboard.trackProgress')}
          </p>
          <Link to={lessons[0] ? `/lesson/${lessons[0].id}` : "#"}>
            <Button variant="outline" size="default" className="rounded-full text-sm sm:text-base">
              {t('dashboard.continueLearning')}
            </Button>
          </Link>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="card-gradient rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-border">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('common.progress')}</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold">{progressPercent}%</p>
          </div>
          <div className="card-gradient rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-border">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('common.attempts')}</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold">{totalAttempts}</p>
          </div>
          <div className="card-gradient rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-border">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('common.completed')}</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold">{completedCount}</p>
          </div>
          <div className="card-gradient rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-border">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('common.remaining')}</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold">{lessons.length - completedCount}</p>
          </div>
        </div>

        {/* Streak, Bookmarks, Invitations - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {/* Streak Tracker */}
          <div className="lg:col-span-1">
            <StreakTracker />
          </div>

          {/* Bookmarked Lessons */}
          <div className="lg:col-span-1">
            <BookmarkedLessons />
          </div>

          {/* Invitation Tracker */}
          <div className="lg:col-span-1">
            <InvitationTracker onInviteClick={() => setInviteModalOpen(true)} />
          </div>

          {/* To-Do List */}
          <div className="lg:col-span-2 xl:col-span-1">
            <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border h-full">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="font-semibold text-sm sm:text-base">{t('dashboard.myTodoItems')}</h2>
                <button onClick={() => { setEditingTodo(null); setTodoModalOpen(true); }} className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> {t('common.add')}
                </button>
              </div>
              <div className="space-y-2 sm:space-y-4 max-h-60 sm:max-h-80 overflow-y-auto">
                {todos.filter(t => !t.done).map((item) => (
                  <div key={item.id} className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${item.urgent ? "bg-destructive/10 border border-destructive/20" : "bg-secondary/50"}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <input type="checkbox" checked={item.done} onChange={() => handleToggleTodo(item.id)} className="rounded shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm truncate">{item.title}</p>
                        {item.urgent && <span className="text-[10px] sm:text-xs text-destructive">{t('common.urgent')}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 shrink-0">
                      <button onClick={() => handleDeleteTodo(item.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                      <button onClick={() => { setEditingTodo(item); setTodoModalOpen(true); }} className="text-primary hover:text-primary/80 p-1"><Edit3 className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                    </div>
                  </div>
                ))}
                {todos.filter(t => t.done).length > 0 && (
                  <div className="pt-2 sm:pt-4 border-t border-border">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> {t('common.completed')}</p>
                    {todos.filter(t => t.done).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 sm:p-3 bg-secondary/30 rounded-lg mb-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <input type="checkbox" checked={item.done} onChange={() => handleToggleTodo(item.id)} className="rounded shrink-0" />
                          <p className="text-xs sm:text-sm line-through text-muted-foreground truncate">{item.title}</p>
                        </div>
                        <button onClick={() => handleDeleteTodo(item.id)} className="text-destructive/50 hover:text-destructive p-1 shrink-0"><Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Download Manager */}
          <div className="mb-4 sm:mb-8">
            <DownloadManager />
          </div>

        {/* Progress Chart - Full Width */}
        <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <h2 className="font-semibold text-sm sm:text-base">{t('dashboard.progressOverview')}</h2>
            <div className="flex gap-1 bg-secondary rounded-lg p-1 self-start sm:self-auto">
              {[
                { key: "Week", label: t('dashboard.week') },
                { key: "Month", label: t('dashboard.month') },
                { key: "Year", label: t('dashboard.year') },
                { key: "All", label: t('dashboard.all') }
              ].map((period) => (
                <button key={period.key} onClick={() => setChartPeriod(period.key)} className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors ${chartPeriod === period.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{period.label}</button>
              ))}
            </div>
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} width={30} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="progress" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lessons - Responsive */}
        <div className="mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('dashboard.lessons')}</h2>
          <div className="space-y-2 sm:space-y-3">
            {lessons.map((lesson) => {
              const isLocked = !canAccessLesson(lesson, profile?.subscription_tier || null);
              const isCompleted = progress[lesson.id]?.completed || false;
              const bookmarked = isBookmarked(lesson.id);
              
              return (
                <div key={lesson.id} className={`card-gradient rounded-xl p-3 sm:p-5 border transition-all duration-300 ${isLocked ? "border-border opacity-60" : "border-border hover:border-primary/50"}`}>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Link to={isLocked ? "#" : `/lesson/${lesson.id}`} onClick={(e) => isLocked && e.preventDefault()} className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? "bg-primary/20" : isLocked ? "bg-muted" : "bg-secondary"}`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-primary" /> : isLocked ? <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-semibold truncate">{lesson.title}</h3>
                          {lesson.is_free && <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/20 text-primary">Free</span>}
                          {lesson.plan_access && lesson.plan_access !== 'free' && (
                            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                              lesson.plan_access === 'starter' ? 'bg-blue-500/20 text-blue-500' :
                              lesson.plan_access === 'pro' ? 'bg-green-500/20 text-green-500' :
                              'bg-purple-500/20 text-purple-500'
                            }`}>
                              {lesson.plan_access.charAt(0).toUpperCase() + lesson.plan_access.slice(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{lesson.description}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{lesson.duration}</span>
                      {!isLocked && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleBookmark(lesson.id)}
                            className={`h-7 w-7 sm:h-9 sm:w-9 ${bookmarked ? "text-primary" : "text-muted-foreground"}`}
                          >
                            <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 ${bookmarked ? "fill-current" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPracticeLesson({ id: lesson.id, title: lesson.title })}
                            className="h-7 w-7 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary"
                          >
                            <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </>
                      )}
                      {isLocked && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={scrollToPricing}
                        >
                          Upgrade
                        </Button>
                      )}
                      {!isLocked && (
                        <Link to={`/lesson/${lesson.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-9 sm:w-9">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Modals */}
      <TodoModal
        open={todoModalOpen}
        onOpenChange={setTodoModalOpen}
        onSave={handleSaveTodo}
        todo={editingTodo}
      />

      <InviteFriendModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />

      <OnboardingWizard
        open={showOnboarding}
        onComplete={() => {
          if (user) {
            localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
          }
          setShowOnboarding(false);
        }}
      />

      {practiceLesson && (
        <PracticeCoach
          lessonId={practiceLesson.id}
          lessonTitle={practiceLesson.title}
          open={!!practiceLesson}
          onOpenChange={(open) => !open && setPracticeLesson(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
