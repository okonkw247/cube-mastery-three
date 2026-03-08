import { useState, useEffect, useCallback } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;
const VISIT_COUNT_KEY = "pwa-visit-count";
const INSTALLED_KEY = "pwa-installed";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || localStorage.getItem(INSTALLED_KEY)) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isiOS);

    // Check if dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // Track visits
    const visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0") + 1;
    localStorage.setItem(VISIT_COUNT_KEY, visits.toString());

    // Show after 2 visits or 30s on first visit
    if (visits >= 2) {
      setTimeout(() => setShowPrompt(true), 2000);
    } else {
      setTimeout(() => setShowPrompt(true), 30000);
    }

    // Listen for beforeinstallprompt (Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for app installed
    const installedHandler = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem(INSTALLED_KEY, "true");
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
        localStorage.setItem(INSTALLED_KEY, "true");
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  // Celebration after install
  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center space-y-4 p-8 rounded-2xl bg-card border border-border max-w-sm mx-4 animate-in fade-in zoom-in duration-500">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-foreground">Welcome!</h2>
          <p className="text-muted-foreground">
            Cube Academy is now on your device. Access your courses offline anytime!
          </p>
          <Button onClick={() => setShowCelebration(false)} className="w-full bg-primary text-primary-foreground">
            Start Learning
          </Button>
        </div>
      </div>
    );
  }

  if (!showPrompt || isInstalled) return null;

  // iOS-specific instructions
  if (isIOS) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md mx-4 mb-4 p-6 rounded-2xl bg-card border border-border space-y-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="Rubiks Academy" className="w-12 h-12 rounded-xl" />
              <div>
                <h3 className="font-semibold text-foreground">Install Rubiks Academy</h3>
                <p className="text-sm text-muted-foreground">Works offline too ⬇️</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-foreground font-semibold text-xs">1</div>
              <span className="flex items-center gap-1">Tap <Share className="w-4 h-4 text-primary" /> Share button</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-foreground font-semibold text-xs">2</div>
              <span className="flex items-center gap-1">Tap <Plus className="w-4 h-4 text-primary" /> Add to Home Screen</span>
            </div>
          </div>
          <Button variant="outline" onClick={handleDismiss} className="w-full">
            Maybe Later
          </Button>
        </div>
      </div>
    );
  }

  // Chrome/Edge/Firefox prompt
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 mb-4 p-6 rounded-2xl bg-card border border-border space-y-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src="/pwa-icon-512.png" alt="Cube Academy" className="w-12 h-12 rounded-xl" />
            <div>
              <h3 className="font-semibold text-foreground">Install Cube Academy</h3>
              <p className="text-sm text-muted-foreground">For easy access! Works offline too ⬇️</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleInstall} className="flex-1 bg-primary text-primary-foreground" disabled={!deferredPrompt}>
            <Download className="w-4 h-4 mr-2" /> Install Now
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
