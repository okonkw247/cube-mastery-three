import { useTranslation } from "react-i18next";
import { TrendingUp, Users, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatWeOfferSection = () => {
  const { t } = useTranslation();

  return (
    <section id="offers" className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-50">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-2xl" />
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-30">
        <div className="w-full h-full rounded-full bg-gradient-to-tl from-destructive/40 to-transparent blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-on-scroll">
          <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider">{t('landing.offer.label')}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-3 sm:mt-4 mb-4 sm:mb-6">
            {t('landing.offer.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.offer.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* Stats Card */}
          <div className="card-gradient rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 border border-border relative overflow-hidden animate-on-scroll">
            <div className="relative z-10">
              {/* Circular Progress */}
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                    <circle cx="96" cy="96" r="80" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                    <circle cx="96" cy="96" r="80" fill="none" stroke="url(#gradient)" strokeWidth="12" strokeDasharray="502" strokeDashoffset="100" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--destructive))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold">30.2K</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('landing.offer.studentsTrained')}</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                {t('landing.offer.weekImprovement')}
              </p>
              <div className="flex justify-center">
                <Button variant="outline" size="sm">
                  {t('landing.offer.trackProgress')}
                </Button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-5 sm:space-y-6 md:space-y-8 animate-on-scroll">
            <div className="flex gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">{t('landing.offer.skillTitle')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('landing.offer.skillDesc')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">{t('landing.offer.practiceTitle')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('landing.offer.practiceDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar Chart Section */}
        <div className="mt-12 sm:mt-16 card-gradient rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 border border-border animate-on-scroll">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t('landing.offer.trackTitle')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                {t('landing.offer.trackDesc')}
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span className="text-xs sm:text-sm">{t('landing.offer.realTime')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span className="text-xs sm:text-sm">{t('landing.offer.detailedAnalytics')}</span>
                </div>
              </div>
            </div>

            {/* Mini Bar Chart - Responsive */}
            <div className="flex items-end justify-center gap-1.5 sm:gap-2 md:gap-3 h-28 sm:h-32 md:h-40 mt-6 md:mt-0">
              {[40, 65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                <div
                  key={i}
                  className="w-4 sm:w-6 md:w-8 rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-primary/50 to-primary transition-all duration-300 hover:from-primary/70 hover:to-primary"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>{t('landing.offer.currentAvg')}</span>
            <span className="text-primary font-semibold">32s → 18s</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatWeOfferSection;
