import { Check, Target, Layers, Zap } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Layer-by-Layer System",
    description: "Our proven method breaks the cube into manageable layers. Master each one before moving on.",
  },
  {
    icon: Target,
    title: "Clear Progression",
    description: "From first solve to sub-30 seconds. Every lesson builds on the last with clear milestones.",
  },
  {
    icon: Zap,
    title: "Speed Techniques",
    description: "Advanced finger tricks, lookahead training, and algorithm optimization for serious speedcubers.",
  },
];

const benefits = [
  "50+ HD video lessons",
  "Printable algorithm sheets",
  "Practice routines",
  "Progress tracking",
  "Community access",
  "Lifetime updates",
];

const SolutionSection = () => {
  return (
    <section id="solution" className="py-16 sm:py-20 md:py-24 relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      
      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-on-scroll">
          <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider">The Solution</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-3 sm:mt-4 mb-4 sm:mb-6">
            The CubeMaster Method
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            A structured, step-by-step video system designed by speedcubing champions to get you solving fast.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Features */}
          <div className="space-y-5 sm:space-y-6 md:space-y-8">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-3 sm:gap-4 md:gap-5 animate-on-scroll" style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits Card */}
          <div className="card-gradient rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-border animate-on-scroll">
            <h3 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-8">What You Get</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
