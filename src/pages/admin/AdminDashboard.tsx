import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { useAdminData } from '@/hooks/useAdminData';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useAdminMilestones } from '@/hooks/useAdminMilestones';
import { CelebrationPopup, useCelebration } from '@/components/admin/CelebrationPopup';
import { Users, BookOpen, Timer, TrendingUp, AlertCircle, Activity, Trophy, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { stats, topPerformers, weeklyActivity, loading } = useAdminData();
  const { activities, getActivityIcon, getActivityColor, formatTimestamp } = useActivityLog();
  const { milestones } = useAdminMilestones();
  const { celebration, celebrate, closeCelebration } = useCelebration();
  const [celebratedMilestones, setCelebratedMilestones] = useState<Set<string>>(new Set());

  // Check for milestone achievements and trigger celebrations
  useEffect(() => {
    if (loading || topPerformers.length === 0) return;

    // Celebrate top performer reaching new point milestones
    const topPerformer = topPerformers[0];
    if (topPerformer) {
      const milestones = [100, 250, 500, 1000, 2500, 5000];
      for (const milestone of milestones) {
        const key = `${topPerformer.id}-points-${milestone}`;
        if (topPerformer.points >= milestone && !celebratedMilestones.has(key)) {
          celebrate('points', `${milestone} Points Achieved!`, topPerformer.name);
          setCelebratedMilestones(prev => new Set([...prev, key]));
          break;
        }
      }
    }

    // Celebrate student count milestones
    const studentMilestones = [10, 50, 100, 500, 1000];
    for (const milestone of studentMilestones) {
      const key = `students-${milestone}`;
      if (stats.totalStudents >= milestone && !celebratedMilestones.has(key)) {
        celebrate('lesson', `${milestone} Students Enrolled!`);
        setCelebratedMilestones(prev => new Set([...prev, key]));
        break;
      }
    }
  }, [loading, topPerformers, stats.totalStudents, celebratedMilestones, celebrate]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t('admin.adminDashboard')}</h1>
          <p className="text-muted-foreground text-sm">{t('auth.welcomeBack')}! Here's what's happening.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title={t('admin.totalStudents')} value={stats.totalStudents} icon={<Users className="w-5 h-5 text-primary" />} />
          <StatCard title={t('admin.activeToday')} value={stats.activeToday} icon={<TrendingUp className="w-5 h-5 text-primary" />} />
          <StatCard title={t('admin.lessons')} value={stats.lessonsUploaded} icon={<BookOpen className="w-5 h-5 text-primary" />} />
          <StatCard title={t('common.completed')} value={stats.lessonsCompleted} icon={<BookOpen className="w-5 h-5 text-primary" />} />
          <StatCard title={t('admin.avgPracticeTime')} value={`${Math.round(stats.avgPracticeTime / 60)}m`} icon={<Timer className="w-5 h-5 text-primary" />} />
          <StatCard title={t('admin.pendingApprovals')} value={stats.pendingApprovals} icon={<AlertCircle className="w-5 h-5 text-primary" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-border">
            <h2 className="font-semibold mb-4">{t('admin.weeklyActivity')}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyActivity.length > 0 ? weeklyActivity : [
                  { name: 'Mon', students: 0 }, { name: 'Tue', students: 0 },
                  { name: 'Wed', students: 0 }, { name: 'Thu', students: 0 },
                  { name: 'Fri', students: 0 }, { name: 'Sat', students: 0 },
                  { name: 'Sun', students: 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="students" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="font-semibold mb-4">{t('admin.topPerformers')}</h2>
            <div className="space-y-4">
              {topPerformers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data yet</p>
              ) : (
                topPerformers.map((user, i) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-4">{i + 1}</span>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar || ''} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.points} pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Student Milestones - Real-Time */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Student Milestones</h2>
            <span className="flex items-center gap-1 text-xs text-primary">
              <Sparkles className="w-3 h-3" />
              Live
            </span>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {milestones.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No completions yet</p>
            ) : (
              milestones.slice(0, 10).map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{milestone.user_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Completed "{milestone.lesson_title}"
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {formatDistanceToNow(new Date(milestone.completed_at), { addSuffix: true })}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-Time Activity Log */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">{t('admin.recentActivity')}</h2>
            <span className="flex items-center gap-1 text-xs text-emerald-500">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Real-time
            </span>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No activity yet</p>
            ) : (
              activities.slice(0, 20).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-lg">{getActivityIcon(activity.action_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${
                          activity.action_type === 'auth' ? 'bg-blue-500/10 text-blue-500' :
                          activity.action_type === 'content' ? 'bg-emerald-500/10 text-emerald-500' :
                          activity.action_type === 'payment' ? 'bg-amber-500/10 text-amber-500' :
                          ''
                        }`}
                      >
                        {activity.action_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.created_at)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{activity.action}</p>
                    {activity.user_email && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.user_email}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CelebrationPopup
        open={celebration.open}
        onClose={closeCelebration}
        type={celebration.type}
        milestone={celebration.milestone}
        userName={celebration.userName}
      />
    </AdminLayout>
  );
}
