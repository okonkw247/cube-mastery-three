import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ContactModal from "@/components/modals/ContactModal";
import GiftModal from "@/components/modals/GiftModal";
import { WhopCheckoutModal } from "@/components/modals/WhopCheckoutModal";
import heroCube from "@/assets/hero-cube.jpg";

const plans = [
  {
    id: "free",
    name: "Free Plan",
    price: "$0",
    period: "/forever",
    description: "Try before you buy. Perfect for exploring.",
    features: [
      "Access to 3 free lessons",
      "Basic algorithm reference",
      "Community forum access",
      "Limited practice tips",
    ],
  },
  {
    id: "starter",
    name: "Starter Plan",
    price: "$15",
    period: " one-time",
    description: "Perfect for beginners new to speedcubing.",
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
    period: " one-time",
    description: "Everything to become a speedcuber.",
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
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For schools and cubing clubs.",
    features: [],
    isEnterprise: true,
  },
];

const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [contactOpen, setContactOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<"starter" | "pro">("starter");
  const { user } = useAuth();
  const navigate = useNavigate();

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
        // Logged in — open embedded checkout
        setCheckoutPlan(selectedPlan);
        setCheckoutOpen(true);
      } else {
        // NOT logged in — send to auth first
        navigate(`/auth?mode=signup&plan=${selectedPlan}`);
      }
    }
  };

  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-on-scroll">
          <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider">Pricing</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-3 sm:mt-4 mb-4 sm:mb-6">
            Choose A Plan That Suits You 👌
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            99% of students excel after subscribing to one of our plans
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
                        Try Free
                      </span>
                    )}
                    {plan.id === "pro" && (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {plan.isEnterprise ? (
                      <span className="text-muted-foreground text-sm">View details</span>
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
                    {selectedPlan === "free" ? "Get Started Free" : `Continue With ${currentPlan.name}`}
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
                      🎁 Gift
                    </Button>
                  )}
                </div>
              </div>
            )}

            {currentPlan.isEnterprise && (
              <div className="card-gradient rounded-2xl p-6 border border-border mt-6 text-center">
                <p className="text-muted-foreground mb-6">
                  Perfect for schools, cubing clubs, and organizations. Get custom pricing, dedicated support, and group features.
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2"
                  onClick={() => setContactOpen(true)}
                >
                  Contact Us
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
