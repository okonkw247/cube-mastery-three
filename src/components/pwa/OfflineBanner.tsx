import { useState, useEffect, useCallback, useRef } from "react";
import { WifiOff } from "lucide-react";

const PING_URL = "/favicon.ico";
const PING_TIMEOUT = 4000;
const RECHECK_INTERVAL = 5000;

async function isGenuinelyOffline(): Promise<boolean> {
  if (!navigator.onLine) return true;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PING_TIMEOUT);
    const res = await fetch(`${PING_URL}?_=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return !res.ok;
  } catch {
    return true;
  }
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const check = useCallback(async () => {
    const result = await isGenuinelyOffline();
    setOffline(result);
    return result;
  }, []);

  useEffect(() => {
    // Initial check
    check();

    const handleOffline = () => {
      setOffline(true);
      // Start polling to detect when we come back
      if (!intervalRef.current) {
        intervalRef.current = setInterval(async () => {
          const still = await isGenuinelyOffline();
          if (!still) {
            setOffline(false);
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
        }, RECHECK_INTERVAL);
      }
    };

    const handleOnline = async () => {
      // Verify with a real ping before hiding
      const still = await isGenuinelyOffline();
      setOffline(still);
      if (!still && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [check]);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[90] bg-destructive text-destructive-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      You're Offline — Your progress will sync when you're back online
    </div>
  );
}
