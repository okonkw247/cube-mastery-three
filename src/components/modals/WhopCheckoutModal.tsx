import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const WHOP_PLAN_ID = "plan_viVMSlpXhqRSZ";

interface WhopCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillEmail?: string;
}

export function WhopCheckoutModal({
  open,
  onOpenChange,
  prefillEmail,
}: WhopCheckoutModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const email = prefillEmail || user?.email || "";
  const [embedFailed, setEmbedFailed] = useState(false);

  useEffect(() => {
    if (open) {
      setEmbedFailed(false);
    }
  }, [open]);

  const handleComplete = useCallback(
    (paymentId: string) => {
      onOpenChange(false);
      toast.success("Welcome to Sub 20 Mastery! Your course is ready 🎉", {
        duration: 5000,
      });
      navigate("/dashboard", { replace: true });
    },
    [onOpenChange, navigate]
  );

  const fallbackUrl = () => {
    const base = `https://whop.com/checkout/${WHOP_PLAN_ID}/`;
    return email ? `${base}?email=${encodeURIComponent(email)}` : base;
  };

  const handleFallback = () => {
    window.open(fallbackUrl(), "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/dashboard`
    : "https://www.cube-mastery.site/dashboard";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-2xl md:max-w-3xl p-0 overflow-hidden bg-card border-border max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Complete Your Purchase
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Use code <span className="font-bold text-primary">EARLYBIRD</span> for $19.99 🔥
            </p>
          </DialogHeader>
        </div>

        {/* Checkout embed — full width */}
        <div className="px-4 sm:px-6 pb-6 pt-2 min-h-[400px]">
          {!embedFailed ? (
            <WhopCheckoutEmbed
              planId={WHOP_PLAN_ID}
              theme="dark"
              returnUrl={returnUrl}
              onComplete={handleComplete}
              fallback={
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading checkout…</p>
                </div>
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Checkout couldn't load in-page. Click below to continue on Whop.
              </p>
              <Button
                variant="default"
                className="gap-2"
                onClick={handleFallback}
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
