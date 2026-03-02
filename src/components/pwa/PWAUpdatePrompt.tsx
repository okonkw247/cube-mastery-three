import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[95] p-4 rounded-xl bg-card border border-border shadow-lg max-w-sm animate-in slide-in-from-bottom duration-300">
      <p className="text-sm text-foreground font-medium mb-3">
        Update available! Get the latest features 🚀
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => updateServiceWorker(true)} className="bg-primary text-primary-foreground">
          <RefreshCw className="w-3 h-3 mr-1" /> Update Now
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
      </div>
    </div>
  );
}
