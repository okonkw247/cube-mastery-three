import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Crown, Flame } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  weekly_xp: number;
  total_points: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    // Use the view
    const { data, error } = await supabase
      .from('weekly_leaderboard' as any)
      .select('*')
      .limit(10);

    if (!error && data) {
      setEntries(data as unknown as LeaderboardEntry[]);
    }
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  const getRankBg = (index: number) => {
    if (index === 0) return "bg-yellow-500/10 border-yellow-500/30";
    if (index === 1) return "bg-gray-400/10 border-gray-400/30";
    if (index === 2) return "bg-amber-600/10 border-amber-600/30";
    return "bg-card border-border";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <LogoWithGlow size="md" />
            <span className="text-lg font-bold hidden sm:inline">Leaderboard</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Weekly Leaderboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Top Cubers This Week</h1>
          <p className="text-sm text-muted-foreground mt-1">Earn XP by completing lessons, logging in daily, and posting in the community</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading leaderboard...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Flame className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No XP earned this week yet. Start learning to claim the top spot!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankBg(index)} ${
                  entry.user_id === user?.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="w-8 flex justify-center">{getRankIcon(index)}</div>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-sm font-bold">{(entry.full_name || "?").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {entry.full_name || "Anonymous"}
                    {entry.user_id === user?.id && <span className="text-xs text-primary ml-2">(You)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.total_points || 0} total XP</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{entry.weekly_xp}</p>
                  <p className="text-[10px] text-muted-foreground">this week</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
