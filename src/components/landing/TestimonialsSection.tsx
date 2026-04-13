const testimonials = [
  {
    name: "Marcus",
    avatar: "https://i.pravatar.cc/150?img=12",
    quote: "I went from 45 seconds to sub-20 in just three weeks. The step-by-step breakdowns made everything click.",
  },
  {
    name: "Sophie",
    avatar: "https://i.pravatar.cc/150?img=32",
    quote: "Best cube training I've found online. The finger trick lessons alone saved me 10 seconds off my average.",
  },
  {
    name: "James",
    avatar: "https://i.pravatar.cc/150?img=53",
    quote: "Finally broke the sub-20 barrier after being stuck for months. The practice coach is a game changer.",
  },
];

const Stars = () => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} className="w-4 h-4 fill-primary" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    ))}
  </div>
);

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">
          What Early Testers Are <span className="text-primary">Saying</span>
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">
          Real results from real cubers who tested the course.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4"
            >
              <Stars />
              <p className="text-foreground/90 text-sm leading-relaxed italic">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-auto pt-2">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                />
                <span className="font-medium text-sm">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
