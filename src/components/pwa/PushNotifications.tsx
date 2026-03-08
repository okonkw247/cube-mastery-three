import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PUSH_DISMISSED_KEY = "push-notification-dismissed";
const VAPID_KEY_CACHE = "vapid-public-key";

async function getVapidPublicKey(): Promise<string | null> {
  const cached = localStorage.getItem(VAPID_KEY_CACHE);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: { action: "get_vapid_key" },
    });
    if (error || !data?.vapid_public_key) return null;
    localStorage.setItem(VAPID_KEY_CACHE, data.vapid_public_key);
    return data.vapid_public_key;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window && "serviceWorker" in navigator && "PushManager" in window);
  }, []);

  // Subscribe to real push via service worker
  const subscribeToPush = useCallback(async () => {
    if (!user || !isSupported) return false;

    try {
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        console.warn("No VAPID key available");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
        });
      }

      const sub = subscription.toJSON();
      if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return false;

      // Save to Supabase
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) console.error("Failed to save push subscription:", error);
      return !error;
    } catch (err) {
      console.error("Push subscription failed:", err);
      return false;
    }
  }, [user, isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      // Subscribe to real push after permission granted
      await subscribeToPush();
    }

    return result === "granted";
  }, [isSupported, subscribeToPush]);

  // Auto-subscribe if permission already granted
  useEffect(() => {
    if (user && isSupported && permission === "granted") {
      subscribeToPush();
    }
  }, [user, isSupported, permission, subscribeToPush]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission !== "granted") return;

      try {
        // Use service worker notification for better reliability
        navigator.serviceWorker?.ready.then((reg) => {
          reg.showNotification(title, {
            icon: "/pwa-icon-512.png",
            badge: "/pwa-icon-512.png",
            ...options,
          });
        });
      } catch {
        try {
          new Notification(title, {
            icon: "/pwa-icon-512.png",
            badge: "/pwa-icon-512.png",
            ...options,
          });
        } catch {}
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

    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, [user, isSupported, permission]);

  const handleAllow = async () => {
    const granted = await requestPermission();
    setShow(false);
    if (granted) {
      toast.success("Notifications enabled! You'll get alerts even when the app is closed.");
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
            Get notified when new courses drop, milestones are reached, and practice reminders — even when the app is closed.
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
