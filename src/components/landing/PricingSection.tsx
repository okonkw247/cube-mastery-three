import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ContactModal from "@/components/modals/ContactModal";
import GiftModal from "@/components/modals/GiftModal";
import { WhopCheckoutModal } from "@/components/modals/WhopCheckoutModal";
import heroCube from "@/assets/hero-cube.jpg";

const PricingSection = () => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [contactOpen, setContactOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<"starter" | "pro">("starter");
  const { user } = useAuth();
  const navigate = useNavigate();

  const plans = useMemo(() => [
    {
      id: "free",
      name: t('landing.pricing.plans.free.name'),
      price: "$0",
      period: t('landing.pricing.forever'),
      description: t('landing.pricing.plans.free.desc'),
      features: [
        t('landing.pricing.plans.free.f1'),
        t('landing.pricing.plans.free.f2'),
        t('landing.pricing.plans.free.f3'),
        t('landing.pricing.plans.free.f4'),
      ],
    },
    {
      id: "starter",
      name: t('landing.pricing.plans.starter.name'),
      price: "$15",
      period: t('landing.pricing.oneTime'),
      description: t('landing.pricing.plans.starter.desc'),
      features: [
        t('landing.pricing.plans.starter.f1'),
        t('landing.pricing.plans.starter.f2'),
        t('landing.pricing.plans.starter.f3'),
        t('landing.pricing.plans.starter.f4'),
        t('landing.pricing.plans.starter.f5'),
        t('landing.pricing.plans.starter.f6'),
      ],
    },
    {
      id: "pro",
      name: t('landing.pricing.plans.pro.name'),
      price: "$40",
      period: t('landing.pricing.oneTime'),
      description: t('landing.pricing.plans.pro.desc'),
      features: [
        t('landing.pricing.plans.pro.f1'),
        t('landing.pricing.plans.pro.f2'),
        t('landing.pricing.plans.pro.f3'),
        t('landing.pricing.plans.pro.f4'),
        t('landing.pricing.plans.pro.f5'),
        t('landing.pricing.plans.pro.f6'),
        t('landing.pricing.plans.pro.f7'),
        t('landing.pricing.plans.pro.f8'),
      ],
    },
    {
      id: "enterprise",
      name: t('landing.pricing.plans.enterprise.name'),
      price: "Custom",
      period: "",
      description: t('landing.pricing.plans.enterprise.desc'),
      features: [],
      isEnterprise: true,
    },
  ], [t]);

  const currentPlan = plans.find((p) => p.id === selectedPlan) || plans[0];

  const handlePlanSelect = () => {
    if (selectedPlan === "free") {
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/auth?mode=signup&plan=free");
      }
      return;
    }

    if (selectedPlan === "enterprise") {
      setContactOpen(true);
      return;
    }

    if (selectedPlan === "starter" || selectedPlan === "pro") {
      if (user) {
        setCheckoutPlan(selectedPlan);
        setCheckoutOpen(true);
      } else {
        navigate(`/auth?mode=signup&plan=${selectedPlan}`);
      }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto items-start">
          {/* Plan Image */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] animate-on-scroll order-2 lg:order-1">
            <img 
              src={heroCube} 
              alt="Cube Mastery" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          </div>

          {/* Plan Selection */}
          <div className="space-y-3 sm:space-y-4 animate-on-scroll order-1 lg:order-2">
            <div className="space-y-2 sm:space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 flex items-center justify-between ${
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedPlan === plan.id
                          ? "border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedPlan === plan.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-semibold">{plan.name}</span>
                    {plan.id === "free" && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {t('landing.pricing.tryFree')}
                      </span>
                    )}
                    {plan.id === "pro" && (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                        {t('landing.pricing.mostPopular')}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {plan.isEnterprise ? (
                      <span className="text-muted-foreground text-sm">{t('landing.pricing.viewDetails')}</span>
                    ) : (
                      <span className="font-bold">
                        {plan.price}
                        <span className="text-muted-foreground font-normal text-sm">
                          {plan.period}
                        </span>
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Plan Details */}
            {!currentPlan.isEnterprise && (
              <div className="card-gradient rounded-2xl p-6 border border-border mt-6">
                <p className="text-muted-foreground mb-6">{currentPlan.description}</p>

                <ul className="space-y-3 mb-8">
                  {currentPlan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  <Button
                    variant="hero"
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={handlePlanSelect}
                  >
                    {selectedPlan === "free" ? t('landing.pricing.getStartedFree') : t('landing.pricing.continueWith', { plan: currentPlan.name })}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  {selectedPlan !== "free" && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() => setGiftOpen(true)}
                    >
                      <Gift className="w-4 h-4" />
                      🎁 {t('landing.pricing.gift')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {currentPlan.isEnterprise && (
              <div className="card-gradient rounded-2xl p-6 border border-border mt-6 text-center">
                <p className="text-muted-foreground mb-6">
                  {t('landing.pricing.enterpriseDesc')}
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2"
                  onClick={() => setContactOpen(true)}
                >
                  {t('landing.pricing.contactUs')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
      <GiftModal open={giftOpen} onOpenChange={setGiftOpen} defaultPlan={selectedPlan === "free" ? "starter" : selectedPlan} />
      <WhopCheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        plans={[checkoutPlan]}
        defaultPlan={checkoutPlan}
      />
    </section>
  );
};

export default PricingSection;
