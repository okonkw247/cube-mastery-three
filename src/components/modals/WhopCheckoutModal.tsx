import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown, Zap, Loader2, ExternalLink } from "lucide-react";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const WHOP_PLAN_IDS = {
  starter: "plan_7NRvNAxpWhOse",
  pro: "plan_aeLinh43MkIpm",
} as const;

const PLAN_META = {
  starter: { name: "Starter Plan", price: "$15", icon: Zap, color: "text-blue-500" },
  pro: { name: "Pro Plan", price: "$40", icon: Crown, color: "text-primary" },
} as const;

type PlanId = "starter" | "pro";

interface WhopCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which plan(s) to show. If undefined, shows all. */
  plans?: PlanId[];
  /** Pre-select a plan tab when showing multiple */
  defaultPlan?: PlanId;
  /** Email to pre-fill for gift purchases */
  prefillEmail?: string;
}

export function WhopCheckoutModal({
  open,
  onOpenChange,
  plans,
  defaultPlan,
  prefillEmail,
}: WhopCheckoutModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const email = prefillEmail || user?.email || "";

  const availablePlans = plans ?? (["starter", "pro"] as PlanId[]);
  const [activePlan, setActivePlan] = useState<PlanId>(defaultPlan ?? availablePlans[0]);
  const [embedFailed, setEmbedFailed] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setActivePlan(defaultPlan ?? availablePlans[0]);
      setEmbedFailed(false);
    }
  }, [open, defaultPlan]);

  const handleComplete = useCallback(
    (paymentId: string) => {
      onOpenChange(false);
      toast.success(`Welcome to ${PLAN_META[activePlan].name}! Your courses are ready 🎉`, {
        duration: 5000,
      });
      // The whop webhook will update the plan in Supabase automatically
      navigate("/dashboard", { replace: true });
    },
    [activePlan, onOpenChange, navigate]
  );

  const fallbackUrl = (planId: PlanId) => {
    const base = `https://whop.com/checkout/${WHOP_PLAN_IDS[planId]}/`;
    return email ? `${base}?email=${encodeURIComponent(email)}` : base;
  };

  const handleFallback = (planId: PlanId) => {
    window.open(fallbackUrl(planId), "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/dashboard`
    : "https://cube-mastery.site/dashboard";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl p-0 overflow-hidden bg-card border-border max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 pb-2">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <DialogTitle className="text-lg sm:text-xl font-bold">
                {availablePlans.length === 1
                  ? `Get ${PLAN_META[availablePlans[0]].name}`
                  : "Choose Your Plan"}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        {/* Plan tabs when showing multiple plans */}
        {availablePlans.length > 1 && (
          <div className="flex gap-2 px-4 sm:px-6">
            {availablePlans.map((planId) => {
              const meta = PLAN_META[planId];
              const Icon = meta.icon;
              const isActive = activePlan === planId;
              return (
                <button
                  key={planId}
                  onClick={() => { setActivePlan(planId); setEmbedFailed(false); }}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary/30 hover:border-primary/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-sm truncate">{meta.name}</p>
                    <p className="text-xs text-muted-foreground">{meta.price} one-time</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Checkout embed */}
        <div className="p-4 sm:p-6 pt-3 min-h-[350px]">
          {!embedFailed ? (
            <WhopCheckoutEmbed
              key={activePlan}
              planId={WHOP_PLAN_IDS[activePlan]}
              theme="dark"
              returnUrl={returnUrl}
              onComplete={handleComplete}
              fallback={
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading checkout…</p>
                </div>
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Checkout couldn't load in-page. Click below to continue on Whop.
              </p>
              <Button
                variant="default"
                className="gap-2"
                onClick={() => handleFallback(activePlan)}
              >
                Open Checkout
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
