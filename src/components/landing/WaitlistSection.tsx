import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WaitlistSection = () => {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ first_name: firstName.trim(), email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already on the list.");
        } else {
          throw error;
        }
      } else {
        // Send welcome email
        try {
          await supabase.functions.invoke("send-welcome-email", {
            body: { email: email.trim().toLowerCase(), name: firstName.trim(), language: "en" },
          });
        } catch (emailErr) {
          console.error("Welcome email failed:", emailErr);
        }
        setSubmitted(true);
        toast.success("You're in. Check your email.");
      }
    } catch (err: any) {
      console.error("Waitlist error:", err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="relative py-24 bg-background overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            The Course Is <span className="text-primary">Coming.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join the waitlist — early bird members lock in at{" "}
            <span className="text-primary font-semibold">$19.99</span> before price goes to $24.99.
          </p>

          {submitted ? (
            <div className="flex items-center justify-center gap-3 py-8 animate-fade-in">
              <CheckCircle className="w-6 h-6 text-primary" />
              <span className="text-lg font-medium">You're in. Check your email.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <Input
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="h-12 bg-secondary/50 border-border/50"
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-secondary/50 border-border/50"
              />
              <Button
                type="submit"
                variant="hero"
                size="lg"
                disabled={loading}
                className="gap-2 whitespace-nowrap"
              >
                {loading ? "Joining…" : "Claim My Early Bird Spot"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;
