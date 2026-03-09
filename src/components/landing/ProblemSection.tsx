import { useTranslation } from "react-i18next";
import { Clock, Frown, Shuffle } from "lucide-react";

const ProblemSection = () => {
  const { t } = useTranslation();

  const problems = [
    {
      icon: Shuffle,
      title: t('landing.problem.stuck.title'),
      description: t('landing.problem.stuck.desc'),
    },
    {
      icon: Clock,
      title: t('landing.problem.slow.title'),
      description: t('landing.problem.slow.desc'),
    },
    {
      icon: Frown,
      title: t('landing.problem.noStructure.title'),
      description: t('landing.problem.noStructure.desc'),
    },
  ];

  return (
    <section id="problem" className="py-16 sm:py-20 md:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-on-scroll">
          <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider">{t('landing.problem.label')}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-3 sm:mt-4 mb-4 sm:mb-6">
            {t('landing.problem.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.problem.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="card-gradient rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-border hover:border-primary/30 transition-all duration-300 group animate-on-scroll"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-destructive/10 flex items-center justify-center mb-4 sm:mb-5 md:mb-6 group-hover:bg-destructive/20 transition-colors">
                <problem.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-destructive" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{problem.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
