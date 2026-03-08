import { useState, useEffect, useCallback } from "react";
import { Target, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useXP } from "@/hooks/useXP";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface DailyChallenge {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
}

export function DailyChallengeCard() {
  const { user } = useAuth();
  const { awardXP } = useXP();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [countdown, setCountdown] = useState("");

  const fetchChallenge = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();

    // Get today's scheduled challenge or a repeating one
    const { data: challenges } = await supabase
      .from('daily_challenges' as any)
      .select('*')
      .eq('is_active', true)
      .or(`scheduled_date.eq.${today},repeat_weekly.eq.true`)
      .limit(1);

    if (challenges && challenges.length > 0) {
      const c = challenges[0] as any;
      setChallenge(c);

      // Check if already completed today
      const { data: completions } = await supabase
        .from('daily_challenge_completions' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_id', c.id)
        .gte('completed_at', today + 'T00:00:00Z')
        .lte('completed_at', today + 'T23:59:59Z')
        .limit(1);

      if (completions && completions.length > 0) {
        setCompleted(true);
      }
    } else {
      // Fallback: get any active challenge
      const { data: fallback } = await supabase
        .from('daily_challenges' as any)
        .select('*')
        .eq('is_active', true)
        .limit(1);
      if (fallback && fallback.length > 0) {
        const c = fallback[0] as any;
        setChallenge(c);

        const { data: completions } = await supabase
          .from('daily_challenge_completions' as any)
          .select('id')
          .eq('user_id', user.id)
          .eq('challenge_id', c.id)
          .gte('completed_at', today + 'T00:00:00Z')
          .lte('completed_at', today + 'T23:59:59Z')
          .limit(1);

        if (completions && completions.length > 0) {
          setCompleted(true);
        }
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchChallenge(); }, [fetchChallenge]);

  // Countdown to midnight
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleComplete = async () => {
    if (!user || !challenge || completed) return;
    setCompleting(true);

    await supabase.from('daily_challenge_completions' as any).insert({
      user_id: user.id,
      challenge_id: challenge.id,
      xp_earned: challenge.xp_reward,
    } as any);

    // Award XP
    await supabase.from('xp_events').insert({
      user_id: user.id,
      action: 'daily_challenge',
      xp_amount: challenge.xp_reward,
      reference_id: challenge.id,
    });

    // Check for 7-day streak
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    const { data: weekCompletions } = await supabase
      .from('daily_challenge_completions' as any)
      .select('completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', last7Days[6] + 'T00:00:00Z');

    const uniqueDays = new Set(
      (weekCompletions || []).map((c: any) => new Date(c.completed_at).toISOString().split('T')[0])
    );

    if (uniqueDays.size >= 7) {
      // Award Challenge Master badge
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', user.id)
        .eq('badge_type', 'challenge_master')
        .limit(1);

      if (!existingBadge || existingBadge.length === 0) {
        await supabase.from('user_badges').insert({
          user_id: user.id,
          badge_type: 'challenge_master',
          badge_name: 'Challenge Master 🏅',
        });
        // Bonus 100 XP
        await supabase.from('xp_events').insert({
          user_id: user.id,
          action: 'challenge_master_bonus',
          xp_amount: 100,
        });
        toast.success("🏅 Challenge Master badge earned! +100 XP bonus!");
      }
    }

    setCompleted(true);
    setCompleting(false);

    // Confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    toast.success(`Challenge completed! +${challenge.xp_reward} XP 🎯`);
  };

  if (loading || !challenge) {
    return (
      <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-sm sm:text-base">Daily Challenge 🎯</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-6">
          {loading ? "Loading..." : "No challenge available today. Check back tomorrow!"}
        </p>
      </div>
    );
  }

  return (
    <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-sm sm:text-base">Daily Challenge 🎯</h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{countdown}</span>
        </div>
      </div>

      <div className={`p-4 rounded-xl mb-4 ${completed ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'}`}>
        <h3 className="font-semibold text-sm mb-1">{challenge.title}</h3>
        {challenge.description && (
          <p className="text-xs text-muted-foreground">{challenge.description}</p>
        )}
        <div className="flex items-center gap-1 mt-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">+{challenge.xp_reward} XP</span>
        </div>
      </div>

      {completed ? (
        <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium py-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Completed! Great work! 🎉</span>
        </div>
      ) : (
        <Button
          className="w-full gap-2"
          onClick={handleComplete}
          disabled={completing}
        >
          <CheckCircle2 className="w-4 h-4" />
          {completing ? "Completing..." : "Complete Challenge ✅"}
        </Button>
      )}
    </div>
  );
}
