import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Flame } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { WhopCheckoutModal } from "@/components/modals/WhopCheckoutModal";

const LAUNCH_END = new Date("2026-03-31T23:59:59Z");

const features = [
  "20+ HD video lessons",
  "Complete sub 20 system",
  "Advanced algorithm library",
  "Speed techniques masterclass",
  "Sub 20 practice routines and drills",
  "Progress tracking dashboard",
  "Private Whop community access",
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
  if (currentTier === "paid") return null;

  const handleGetPlan = () => {
    setCheckoutOpen(true);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 overflow-hidden bg-background border-border max-h-[90vh] overflow-y-auto [&>button]:text-muted-foreground">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-primary" />

          <div className="p-5 sm:p-8">
            {/* Header — no icon */}
            <div className="mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Sub 20 Mastery
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Everything you need to break sub 20
              </p>
            </div>

            {/* Price block */}
            <div className="mt-6 mb-6">
              <div className="flex items-baseline gap-2">
                {isLaunch ? (
                  <>
                    <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">$19.99</span>
                    <span className="text-base text-muted-foreground line-through">$24.99</span>
                  </>
                ) : (
                  <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">$24.99</span>
                )}
                <span className="text-sm text-muted-foreground font-medium">one-time</span>
              </div>
              {isLaunch && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
                  <Flame className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">Launch price · Use code EARLYBIRD</span>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2.5 mb-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/80">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={handleGetPlan}
              className="w-full h-12 text-sm font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_24px_hsl(175_80%_50%/0.25)] hover:shadow-[0_6px_32px_hsl(175_80%_50%/0.35)] transition-all duration-300"
            >
              Get Lifetime Access
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-center text-[11px] text-muted-foreground mt-3">
              One-time payment · No subscription · Instant access
            </p>
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
