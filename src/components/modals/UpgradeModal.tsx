import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Crown, Zap, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const WHOP_PLAN_IDS = {
  starter: "plan_7NRvNAxpWhOse",
  pro: "plan_aeLinh43MkIpm",
};

const plans = [
  {
    id: "starter",
    name: "Starter Plan",
    price: "$15",
    period: "one-time",
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    features: [
      "Access to 15 video lessons",
      "Basic algorithm library",
      "Beginner practice routines",
      "Community forum access",
      "Weekly progress reports",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: "$40",
    period: "one-time",
    icon: Crown,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    popular: true,
    features: [
      "50+ HD video lessons",
      "Advanced algorithm library",
      "Speed techniques masterclass",
      "Practice routines & drills",
      "Progress tracking dashboard",
      "Private Discord community",
      "1-on-1 coaching session",
      "Lifetime access & updates",
    ],
  },
];

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightPlan?: string;
}

export function UpgradeModal({ open, onOpenChange, highlightPlan }: UpgradeModalProps) {
  const { profile } = useProfile();
  const { user } = useAuth();
  const currentTier = profile?.subscription_tier || "free";

  const tierHierarchy = ["free", "starter", "pro", "enterprise"];
  const currentIndex = tierHierarchy.indexOf(currentTier);

  // Only show plans above user's current tier
  const availablePlans = plans.filter((plan) => {
    const planIndex = tierHierarchy.indexOf(plan.id);
    return planIndex > currentIndex;
  });

  const handleSelectPlan = (planId: string) => {
    const whopPlanId = WHOP_PLAN_IDS[planId as keyof typeof WHOP_PLAN_IDS];
    if (!whopPlanId) return;

    const checkoutUrl = `https://whop.com/checkout/${whopPlanId}/`;
    if (user?.email) {
      window.open(`${checkoutUrl}?email=${encodeURIComponent(user.email)}`, "_blank");
    } else {
      window.open(checkoutUrl, "_blank");
    }
    onOpenChange(false);
  };

  if (availablePlans.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl p-0 overflow-hidden bg-card border-border">
        <div className="p-6 pb-2">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <DialogTitle className="text-xl font-bold">
                Upgrade Your Plan
              </DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlock more courses and features to accelerate your cubing journey.
            </p>
          </DialogHeader>
        </div>

        <div className={`grid gap-4 p-6 pt-2 ${availablePlans.length > 1 ? "md:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"}`}>
          {availablePlans.map((plan) => {
            const Icon = plan.icon;
            const isHighlighted = highlightPlan === plan.id || (availablePlans.length === 1);

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-5 transition-all ${
                  isHighlighted || plan.popular
                    ? `${plan.borderColor} ${plan.bgColor}`
                    : "border-border bg-secondary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${plan.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${plan.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{plan.name}</h3>
                    <p className="text-sm">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.color}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular || isHighlighted ? "default" : "outline"}
                  className="w-full gap-2"
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  Get {plan.name}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
