import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, type Notification as AppNotification } from '@/hooks/useNotifications';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { LogoWithGlow } from '@/components/LogoWithGlow';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  Bell,
  Video,
  FileText,
  BookOpen,
  Megaphone,
  ArrowLeft,
  CheckCheck,
  LogOut,
  Settings,
} from 'lucide-react';

const getNotificationIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'new_video':
      return <Video className="w-5 h-5 text-blue-500" />;
    case 'new_notes':
      return <FileText className="w-5 h-5 text-green-500" />;
    case 'new_hologram_sheet':
      return <BookOpen className="w-5 h-5 text-purple-500" />;
    case 'announcement':
      return <Megaphone className="w-5 h-5 text-orange-500" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
};

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const { formatActivity } = useSettingsContext();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.reference_id) {
      navigate(`/lesson/${notification.reference_id}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <LogoWithGlow size="md" />
            <span className="text-lg sm:text-xl font-bold text-foreground hidden xs:inline">
              {t('common.cubeMastery')}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSelector compact />
            <ThemeToggle />
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">{t('common.signOut')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* Back Button & Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Bell className="w-6 h-6" />
                {t('common.notifications')}
              </h1>
              <p className="text-muted-foreground text-sm">
                {unreadCount > 0 
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="card-gradient rounded-2xl border border-border overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm mt-1">We'll notify you when something new happens</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full flex items-start gap-4 p-4 sm:p-6 text-left hover:bg-secondary/50 transition-colors ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="shrink-0 mt-1 w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className={`text-base ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-3 h-3 bg-primary rounded-full shrink-0 mt-1 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatActivity(notification.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
