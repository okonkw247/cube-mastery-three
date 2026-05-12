import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { UpgradeModal } from "@/components/modals/UpgradeModal";

const DISMISS_KEY = "upgrade_banner_dismissed_until";

export function UpgradeBanner() {
  const { profile } = useProfile();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsPWA(mq.matches || (navigator as any).standalone === true);
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    mq.addEventListener("change", handler);

    // Check dismiss timer (re-show after 24h)
    const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (until && Date.now() < until) setDismissed(true);

    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setDismissed(true);
  };

  const currentTier = profile?.subscription_tier || "free";
  if (currentTier === "paid" || dismissed) return null;

  return (
    <>
      <div
        className="fixed left-0 right-0 z-[60] px-2 sm:px-4 pb-2 sm:pb-3"
        style={{ bottom: isPWA ? "calc(64px + env(safe-area-inset-bottom, 0px))" : 0 }}
      >
        <div className="container mx-auto max-w-5xl">
          {/* Animated gradient border wrapper */}
          <div className="relative rounded-2xl p-[1.5px] gradient-sweep shadow-[0_8px_40px_-12px_hsl(175_80%_50%/0.45)]">
            <div className="relative rounded-[14px] bg-[hsl(220_22%_6%/0.92)] backdrop-blur-xl px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 overflow-hidden">
              {/* Subtle radial glow */}
              <div className="pointer-events-none absolute -inset-px opacity-60"
                   style={{ background: "radial-gradient(600px circle at 0% 50%, hsl(175 80% 50% / 0.12), transparent 40%)" }} />

              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 relative">
                <div className="hidden xs:flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/30 items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] sm:text-sm font-semibold text-foreground tracking-tight truncate">
                    Ready to go <span className="text-primary">Sub-20</span>?
                  </p>
                  <p className="hidden sm:block text-xs text-muted-foreground/90 mt-0.5">
                    Unlock the complete system used by 2,000+ cubers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0 relative">
                <Button
                  size="sm"
                  onClick={() => setUpgradeOpen(true)}
                  className="btn-shine relative overflow-hidden gap-1.5 text-xs sm:text-sm px-3.5 sm:px-5 h-8 sm:h-9 font-semibold rounded-lg bg-gradient-to-br from-primary to-[hsl(190_90%_45%)] text-primary-foreground hover:shadow-[0_0_28px_-4px_hsl(175_80%_50%/0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  <span className="relative z-10">Upgrade Now</span>
                  <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <button
                  onClick={handleDismiss}
                  aria-label="Dismiss"
                  className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer so content isn't covered */}
      <div style={{ height: isPWA ? 132 : 64 }} className="sm:hidden" />
      <div className="hidden sm:block h-16 md:h-20" />

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
