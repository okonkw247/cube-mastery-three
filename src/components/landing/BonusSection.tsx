import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Timer, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const bonuses = [
  {
    icon: FileText,
    title: "Algorithm Cheat Sheet",
    description: "All essential algorithms on one printable page",
  },
  {
    icon: Timer,
    title: "Practice Routine Guide",
    description: "Daily drills to build muscle memory fast",
  },
  {
    icon: BookOpen,
    title: "Speedcubing Glossary",
    description: "Learn the language of competitive cubing",
  },
];

const BonusSection = React.forwardRef<HTMLElement>((_, ref) => {
  return (
    <section className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8 animate-on-scroll">
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Free Bonus</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-on-scroll">
            Get Your Free <span className="text-gradient">Starter Kit</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto animate-on-scroll">
            Sign up today and get instant access to these bonus resources — no payment required.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12">
            {bonuses.map((bonus, index) => (
              <div
                key={index}
                className="card-gradient rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-border text-center animate-on-scroll"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <bonus.icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{bonus.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{bonus.description}</p>
              </div>
            ))}
          </div>

          <Link to="/auth?mode=signup" className="animate-on-scroll inline-block">
            <Button variant="hero" size="lg" className="gap-2 sm:gap-3 text-sm sm:text-base">
              Get Free Access
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BonusSection;
