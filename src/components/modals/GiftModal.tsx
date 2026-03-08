import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { WhopCheckoutModal } from "@/components/modals/WhopCheckoutModal";

const giftSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  message: z.string().trim().max(500).optional(),
});

interface GiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlan?: string;
}

export default function GiftModal({ open, onOpenChange, defaultPlan = "starter" }: GiftModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [sending, setSending] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const plans = [
    { id: "starter", name: "Starter Plan", price: "$15" },
    { id: "pro", name: "Pro Plan", price: "$40" },
  ];

  const handleGift = async () => {
    const validation = giftSchema.safeParse({ email, message });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSending(true);

    try {
      // Save gift record
      await supabase.from('gifts' as any).insert({
        sender_id: user?.id,
        recipient_email: email.trim(),
        plan: selectedPlan,
        personal_message: message.trim() || null,
      } as any);

      // Open embedded checkout with recipient email pre-filled
      onOpenChange(false);
      setCheckoutOpen(true);
    } catch {
      toast.error("Failed to process gift");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Gift a Course 🎁
            </DialogTitle>
            <DialogDescription>
              Send a course as a gift to someone special
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Plan selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedPlan === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary/30 hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient's Email</label>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Personal message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Personal Message (optional)</label>
              <Textarea
                placeholder="Happy birthday! I thought you'd love learning to solve the cube..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            <Button className="w-full gap-2" onClick={handleGift} disabled={sending || !email}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Processing..." : "Proceed to Checkout"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WhopCheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        plans={[(selectedPlan === "starter" || selectedPlan === "pro") ? selectedPlan : "starter"]}
        defaultPlan={(selectedPlan === "starter" || selectedPlan === "pro") ? selectedPlan : "starter"}
        prefillEmail={email.trim()}
      />
    </>
  );
}
