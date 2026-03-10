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

export default function GiftModal({ open, onOpenChange }: GiftModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleGift = async () => {
    const validation = giftSchema.safeParse({ email, message });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSending(true);
    try {
      await supabase.from('gifts' as any).insert({
        sender_id: user?.id,
        recipient_email: email.trim(),
        plan: "paid",
        personal_message: message.trim() || null,
      } as any);

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
              Gift Sub 20 Mastery 🎁
            </DialogTitle>
            <DialogDescription>
              Gift the course to someone special
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5">
              <p className="font-semibold text-sm">Sub 20 Mastery</p>
              <p className="text-xs text-muted-foreground">$24.99 one-time</p>
            </div>

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

            <div className="space-y-2">
              <label className="text-sm font-medium">Personal Message (optional)</label>
              <Textarea
                placeholder="Happy birthday! I thought you'd love breaking sub 20..."
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
        prefillEmail={email.trim()}
      />
    </>
  );
}
