import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, Flame } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { WhopCheckoutModal } from "@/components/modals/WhopCheckoutModal";

// Launch countdown: 21 days from March 10, 2026
const LAUNCH_END = new Date("2026-03-31T23:59:59Z");

const features = [
  "20+ HD video lessons",
  "Complete sub 20 system",
  "Advanced algorithm library",
  "Speed techniques masterclass",
  "Sub 20 practice routines and drills",
  "Progress tracking dashboard",
  "Private Discord community access",
  "Lifetime access and updates",
];

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightPlan?: string;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { profile } = useProfile();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isLaunch, setIsLaunch] = useState(true);

  useEffect(() => {
    setIsLaunch(new Date() < LAUNCH_END);
  }, [open]);

  const currentTier = profile?.subscription_tier || "free";

  // Paid users don't need upgrade
  if (currentTier === "paid") return null;

  const handleGetPlan = () => {
    setCheckoutOpen(true);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 overflow-hidden bg-card border-border max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 pb-2">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  Upgrade to Sub 20 Mastery
                </DialogTitle>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                The complete system to break sub 20. Every lesson, every technique, every drill.
              </p>
            </DialogHeader>
          </div>

          <div className="p-4 sm:p-6 pt-2">
            <div className="relative rounded-xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
              {/* Launch badge */}
              {isLaunch && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Launch Price
                </div>
              )}

              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 mt-1">
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Sub 20 Mastery</h3>
                  <p className="text-xs sm:text-sm">
                    {isLaunch ? (
                      <>
                        <span className="line-through text-muted-foreground">$24.99</span>{" "}
                        <span className="text-xl sm:text-2xl font-bold text-primary">$19.99</span>
                        <span className="text-muted-foreground ml-1">one-time</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl sm:text-2xl font-bold">$24.99</span>
                        <span className="text-muted-foreground ml-1">one-time</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-5">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="default"
                className="w-full gap-2 text-xs sm:text-sm h-9 sm:h-10"
                onClick={handleGetPlan}
              >
                Break Sub 20 Now →
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>

              {isLaunch && (
                <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-2">
                  Use code <span className="font-bold text-primary">EARLYBIRD</span> for $19.99 🔥
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WhopCheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      />
    </>
  );
}
