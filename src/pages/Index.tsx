import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import WhatWeOfferSection from "@/components/landing/WhatWeOfferSection";
import SolutionSection from "@/components/landing/SolutionSection";
import PricingSection from "@/components/landing/PricingSection";
import BonusSection from "@/components/landing/BonusSection";
import FooterSection from "@/components/landing/FooterSection";
import VideoAdOverlay from "@/components/modals/VideoAdOverlay";
import { LaunchBanner } from "@/components/LaunchBanner";
import { useScrollAnimations } from "@/hooks/useScrollAnimation";

const Index = () => {
  useScrollAnimations();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      <LaunchBanner />
      <Navbar />
      <HeroSection onPreviewModalChange={setIsPreviewModalOpen} />
      <ProblemSection />
      <WhatWeOfferSection />
      <SolutionSection />
      <PricingSection />
      <BonusSection />
      <FooterSection />
      <VideoAdOverlay isPreviewModalOpen={isPreviewModalOpen} />
    </main>
  );
};

export default Index;
