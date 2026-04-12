import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BrandMarquee from "@/components/landing/BrandMarquee";
import ProblemSection from "@/components/landing/ProblemSection";
import WhatWeOfferSection from "@/components/landing/WhatWeOfferSection";
import SolutionSection from "@/components/landing/SolutionSection";
import PricingSection from "@/components/landing/PricingSection";
import BonusSection from "@/components/landing/BonusSection";
import FooterSection from "@/components/landing/FooterSection";
import VideoAdOverlay from "@/components/modals/VideoAdOverlay";
import WaitlistSection from "@/components/landing/WaitlistSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import { LaunchBanner } from "@/components/LaunchBanner";
import { useScrollAnimations } from "@/hooks/useScrollAnimation";

// Toggle this to switch between pre-launch (waitlist) and live (payment) mode
export const LAUNCH_MODE = false;

const Index = () => {
  useScrollAnimations();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      <LaunchBanner />
      <Navbar />
      <HeroSection onPreviewModalChange={setIsPreviewModalOpen} launchMode={LAUNCH_MODE} />
      <BrandMarquee />
      {!LAUNCH_MODE && <WaitlistSection />}
      {!LAUNCH_MODE && <TestimonialsSection />}
      <ProblemSection />
      <WhatWeOfferSection />
      <SolutionSection />
      {LAUNCH_MODE && <PricingSection />}
      <BonusSection />
      <FooterSection />
      <VideoAdOverlay isPreviewModalOpen={isPreviewModalOpen} />
    </main>
  );
};

export default Index;
