import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { UpgradeModal } from "@/components/modals/UpgradeModal";

export function UpgradeBanner() {
  const { profile } = useProfile();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const currentTier = profile?.subscription_tier || "free";
  if (currentTier === "paid") return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground truncate">
              Unlock the full Sub 20 system
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5 text-xs sm:text-sm px-3 sm:px-4 font-semibold"
            onClick={() => setUpgradeOpen(true)}
          >
            Upgrade
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="h-12 sm:h-14" />

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
