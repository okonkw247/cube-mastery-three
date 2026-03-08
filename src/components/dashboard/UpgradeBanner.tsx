import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Crown } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { UpgradeModal } from "@/components/modals/UpgradeModal";

export function UpgradeBanner() {
  const { profile, isPro } = useProfile();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const currentTier = profile?.subscription_tier || "free";

  // Pro and enterprise users don't see the banner
  if (currentTier === "pro" || currentTier === "enterprise" || isPro) return null;

  const isFree = currentTier === "free";

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isFree ? (
              <Rocket className="w-5 h-5 text-primary shrink-0" />
            ) : (
              <Crown className="w-5 h-5 text-primary shrink-0" />
            )}
            <p className="text-sm font-medium truncate">
              {isFree
                ? "Unlock more courses — Upgrade your plan 🚀"
                : "Go Pro and unlock everything 👑"}
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setUpgradeOpen(true)}
          >
            {isFree ? "Upgrade Now" : "Upgrade to Pro"}
          </Button>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind the sticky banner */}
      <div className="h-14" />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        highlightPlan={isFree ? undefined : "pro"}
      />
    </>
  );
}
