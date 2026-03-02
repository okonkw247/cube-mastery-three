import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PUSH_DISMISSED_KEY = "push-notification-dismissed";

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window && "serviceWorker" in navigator);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, [isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission !== "granted") return;
      
      try {
        new Notification(title, {
          icon: "/pwa-icon-512.png",
          badge: "/pwa-icon-512.png",
          ...options,
        });
      } catch {
        // SW notification fallback
        navigator.serviceWorker?.ready.then((reg) => {
          reg.showNotification(title, {
            icon: "/pwa-icon-512.png",
            badge: "/pwa-icon-512.png",
            ...options,
          });
        });
      }
    },
    [permission]
  );

  return { permission, isSupported, requestPermission, sendNotification };
}

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || !isSupported || permission !== "default") return;
    
    const dismissed = localStorage.getItem(PUSH_DISMISSED_KEY);
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 14) return;
    }

    // Show after 10 seconds on dashboard
    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, [user, isSupported, permission]);

  const handleAllow = async () => {
    const granted = await requestPermission();
    setShow(false);
    if (granted) {
      toast.success("Notifications enabled! You'll get alerts for new courses and milestones.");
      // Send welcome notification
      try {
        new Notification("Cube Academy Notifications Enabled! 🎉", {
          body: "You'll receive alerts for new courses, milestones, and reminders.",
          icon: "/pwa-icon-512.png",
        });
      } catch {}
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(PUSH_DISMISSED_KEY, Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[80] max-w-sm p-4 rounded-xl bg-card border border-border shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground text-sm">Stay Updated</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Get notified when new courses drop, milestones are reached, and practice reminders.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAllow} className="bg-primary text-primary-foreground text-xs">
              Allow Notifications
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs">
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
