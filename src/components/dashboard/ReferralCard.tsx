import { useState } from "react";
import { Copy, Share2, Users, UserPlus, DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReferrals } from "@/hooks/useReferrals";
import { toast } from "sonner";

export function ReferralCard() {
  const { referralLink, clickCount, signupCount, paidCount, loading } = useReferrals();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    if (!referralLink) return;
    const text = encodeURIComponent("Join me on Cube Mastery and learn to solve the Rubik's cube! 🧩⚡");
    const url = encodeURIComponent(referralLink);
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      tiktok: `https://www.tiktok.com/share?url=${url}`,
    };
    window.open(links[platform], '_blank', 'noopener,noreferrer');
  };

  if (loading) return null;

  return (
    <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm sm:text-base">My Referral Link</h2>
        <UserPlus className="w-5 h-5 text-primary" />
      </div>

      {/* Link + Copy */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-xs sm:text-sm truncate text-muted-foreground font-mono">
          {referralLink || "Generating..."}
        </div>
        <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleShare('whatsapp')}>
          WhatsApp
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleShare('twitter')}>
          Twitter
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleShare('tiktok')}>
          TikTok
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-xl bg-secondary/50">
          <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-bold">{clickCount}</p>
          <p className="text-[10px] text-muted-foreground">Clicks</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-secondary/50">
          <UserPlus className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">{signupCount}</p>
          <p className="text-[10px] text-muted-foreground">Signups</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-secondary/50">
          <DollarSign className="w-4 h-4 mx-auto mb-1 text-green-500" />
          <p className="text-lg font-bold">{paidCount}</p>
          <p className="text-[10px] text-muted-foreground">Paid</p>
        </div>
      </div>
    </div>
  );
}
