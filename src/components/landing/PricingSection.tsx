import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Gift, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import GiftModal from "@/components/modals/GiftModal";
import { WhopCheckoutModal } from "@/components/modals/WhopCheckoutModal";
import heroCube from "@/assets/hero-cube.jpg";

// Launch end date
const LAUNCH_END = new Date("2026-03-31T23:59:59Z");

function pad(n: number) { return String(n).padStart(2, "0"); }

const PricingSection = () => {
  const { t } = useTranslation();
  const [giftOpen, setGiftOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isLaunch, setIsLaunch] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const tick = () => {
      const diff = LAUNCH_END.getTime() - Date.now();
      if (diff <= 0) { setIsLaunch(false); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const [selectedPlan, setSelectedPlan] = useState("paid");

  const freeFeatures = [
    "Course introduction video",
    "First chunk preview",
    "Community forum read access",
  ];

  const paidFeatures = [
    "20+ HD video lessons",
    "Complete sub 20 system",
    "Advanced algorithm library",
    "Lookahead & finger tricks training",
    "Sub 20 practice routines and drills",
    "Progress tracking dashboard",
    "Private Discord community access",
    "Lifetime access and updates",
  ];

  const handlePlanSelect = () => {
    if (selectedPlan === "free") {
      if (user) navigate("/dashboard");
      else navigate("/auth?mode=signup&plan=free");
      return;
    }
    if (user) {
      setCheckoutOpen(true);
    } else {
      navigate("/auth?mode=signup&plan=paid");
    }
  };

  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-on-scroll">
          <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider">{t('landing.pricing.label')}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-3 sm:mt-4 mb-4 sm:mb-6">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.pricing.subtitle')}
          </p>
        </div>

        {/* Launch Offer Banner */}
        {isLaunch && (
          <div className="max-w-2xl mx-auto mb-8 animate-on-scroll">
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-primary" />
                <span className="font-bold text-base sm:text-lg">Limited Launch Offer</span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-3">
                Use code <span className="font-bold text-primary">EARLYBIRD</span> at checkout
              </p>
              <p className="text-sm">
                Get Sub 20 Mastery for <span className="font-bold text-primary text-lg">$19.99</span>{" "}
                <span className="line-through text-muted-foreground">$24.99</span>
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 font-mono text-sm font-bold">
                <span>Offer ends in:</span>
                <span className="bg-primary/20 text-primary rounded px-2 py-0.5">{pad(timeLeft.days)}d</span>
                <span>:</span>
                <span className="bg-primary/20 text-primary rounded px-2 py-0.5">{pad(timeLeft.hours)}h</span>
                <span>:</span>
                <span className="bg-primary/20 text-primary rounded px-2 py-0.5">{pad(timeLeft.minutes)}m</span>
                <span>:</span>
                <span className="bg-primary/20 text-primary rounded px-2 py-0.5">{pad(timeLeft.seconds)}s</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto items-start">
          {/* Plan Image */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] animate-on-scroll order-2 lg:order-1">
            <img src={heroCube} alt="Cube Mastery" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          </div>

          {/* Plan Selection */}
          <div className="space-y-3 sm:space-y-4 animate-on-scroll order-1 lg:order-2">
            <div className="space-y-2 sm:space-y-3">
              {/* Free Plan */}
              <button
                onClick={() => setSelectedPlan("free")}
                className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 flex items-center justify-between ${
                  selectedPlan === "free" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlan === "free" ? "border-primary" : "border-muted-foreground"}`}>
                    {selectedPlan === "free" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="font-semibold">Free</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Try Free</span>
                </div>
                <span className="font-bold">$0<span className="text-muted-foreground font-normal text-sm">/forever</span></span>
              </button>

              {/* Sub 20 Mastery Plan */}
              <button
                onClick={() => setSelectedPlan("paid")}
                className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 flex items-center justify-between ${
                  selectedPlan === "paid" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlan === "paid" ? "border-primary" : "border-muted-foreground"}`}>
                    {selectedPlan === "paid" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="font-semibold">Sub 20 Mastery</span>
                  {isLaunch && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Launch Price
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {isLaunch ? (
                    <span className="font-bold">
                      <span className="line-through text-muted-foreground text-sm mr-1">$24.99</span>
                      $19.99
                    </span>
                  ) : (
                    <span className="font-bold">$24.99<span className="text-muted-foreground font-normal text-sm"> one-time</span></span>
                  )}
                </div>
              </button>
            </div>

            {/* Selected Plan Details */}
            <div className="card-gradient rounded-2xl p-6 border border-border mt-6">
              {selectedPlan === "free" ? (
                <>
                  <p className="text-muted-foreground mb-6">Get a taste of the sub 20 system before you commit</p>
                  <ul className="space-y-3 mb-8">
                    {freeFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-6">
                    The complete system to go from 30 seconds to breaking sub 20. Every lesson, every technique, every drill you need.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {paidFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="flex gap-2">
                <Button variant="hero" size="lg" className="flex-1 gap-2" onClick={handlePlanSelect}>
                  {selectedPlan === "free" ? "Start Free →" : "Break Sub 20 Now →"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                {selectedPlan !== "free" && (
                  <Button variant="outline" size="lg" className="gap-2" onClick={() => setGiftOpen(true)}>
                    <Gift className="w-4 h-4" />
                    🎁 {t('landing.pricing.gift')}
                  </Button>
                )}
              </div>

              {selectedPlan === "paid" && isLaunch && (
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Use code <span className="font-bold text-primary">EARLYBIRD</span> for $19.99 🔥
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <GiftModal open={giftOpen} onOpenChange={setGiftOpen} />
      <WhopCheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </section>
  );
};

export default PricingSection;
