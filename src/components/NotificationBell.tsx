import { useState, useEffect } from 'react';
import { Bell, Check, Video, FileText, BookOpen, Megaphone, ExternalLink, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, type Notification as AppNotification } from '@/hooks/useNotifications';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsContext } from '@/contexts/SettingsContext';

const getNotificationIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'new_video':
      return <Video className="w-4 h-4 text-blue-500" />;
    case 'new_notes':
      return <FileText className="w-4 h-4 text-green-500" />;
    case 'new_hologram_sheet':
      return <BookOpen className="w-4 h-4 text-purple-500" />;
    case 'announcement':
      return <Megaphone className="w-4 h-4 text-orange-500" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

// Time ago function with i18n support
function useTimeAgo() {
  const { t } = useTranslation();
  
  return (date: string | Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return t('time.justNow');
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return t('time.minutesAgo', { count: mins });
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return t('time.hoursAgo', { count: hours });
    }
    if (seconds < 604800) {
      const days = Math.floor(seconds / 86400);
      return t('time.daysAgo', { count: days });
    }
    return new Date(date).toLocaleDateString();
  };
}

export function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const timeAgo = useTimeAgo();
  const { formatActivity } = useSettingsContext();

  // Request browser notifications permission if enabled in settings
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Don't auto-request, wait for user action in settings
    }
  }, []);

  // Browser push notifications are handled by useSmartNotifications

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to lesson if reference_id exists
    if (notification.reference_id) {
      navigate(`/lesson/${notification.reference_id}`);
      setOpen(false);
    }
  };

  // Only show first 5 in dropdown
  const displayedNotifications = notifications.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">{t('common.notifications')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary h-auto p-1 gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-pulse">Loading...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">We'll notify you when something new happens</p>
            </div>
          ) : (
            <>
              {displayedNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message.length > 50 
                        ? `${notification.message.substring(0, 50)}...` 
                        : notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2 animate-pulse" />
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        {notifications.length > 5 && (
          <div className="p-3 border-t border-border">
            <Link to="/notifications" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full gap-2 text-primary">
                <ExternalLink className="w-3 h-3" />
                View all {notifications.length} notifications
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
