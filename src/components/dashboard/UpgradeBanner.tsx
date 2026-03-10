import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { UpgradeModal } from "@/components/modals/UpgradeModal";

export function UpgradeBanner() {
  const { profile } = useProfile();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const currentTier = profile?.subscription_tier || "free";

  // Paid users don't see the banner
  if (currentTier === "paid") return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <p className="text-xs sm:text-sm font-medium truncate">
              Unlock the full sub 20 system 🚀
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="shrink-0 gap-1 sm:gap-1.5 text-xs sm:text-sm px-3 sm:px-4"
            onClick={() => setUpgradeOpen(true)}
          >
            Get Sub 20 Mastery →
          </Button>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind the sticky banner */}
      <div className="h-12 sm:h-14" />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
      />
    </>
  );
}
