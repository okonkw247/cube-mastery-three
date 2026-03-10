import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import { ArrowLeft, Share2, Trophy, Flame, Award, Users, Calendar, Shield, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PublicProfileData {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  subscription_tier: string;
  total_points: number;
  created_at: string;
  profile_visibility?: string;
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [coursesCompleted, setCoursesCompleted] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) return;
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    // Find by username
    const { data, error } = await supabase
      .from('profiles' as any)
      .select('user_id, full_name, avatar_url, username, subscription_tier, total_points, created_at')
      .eq('username', username)
      .maybeSingle();

    if (!data) {
      setLoading(false);
      return;
    }

    const p = data as any as PublicProfileData;
    setProfile(p);

    // Check privacy
    const { data: settings } = await supabase
      .from('user_settings')
      .select('profile_visibility')
      .eq('user_id', p.user_id)
      .maybeSingle();

    if (settings?.profile_visibility === 'private') {
      setIsPrivate(true);
      setLoading(false);
      return;
    }

    // Fetch badges
    const { data: badgeData } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', p.user_id);
    if (badgeData) setBadges(badgeData);

    // Fetch courses completed count
    const { data: completions } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', p.user_id)
      .eq('completed', true);
    setCoursesCompleted(completions?.length || 0);

    // Fetch referral count
    const { data: refs } = await supabase
      .from('referrals' as any)
      .select('id')
      .eq('referrer_id', p.user_id)
      .in('status', ['signed_up', 'paid']);
    setReferralCount(refs?.length || 0);

    setLoading(false);
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `I'm learning Rubik's cube solving! Check out my progress 🧩⚡ ${url}`;
    
    if (navigator.share) {
      navigator.share({ title: "My Cube Mastery Profile", text, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Profile link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const planBadge = (tier: string) => {
    const colors: Record<string, string> = {
      free: "bg-secondary text-muted-foreground",
      paid: "bg-primary/20 text-primary",
      starter: "bg-primary/20 text-primary",
      pro: "bg-primary/20 text-primary",
      enterprise: "bg-primary/20 text-primary",
    };
    return colors[tier] || colors.free;
  };

  // XP Level calculation
  const level = Math.floor((profile?.total_points || 0) / 100) + 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <Link to="/"><Button variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/"><LogoWithGlow size="md" /></Link>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Shield className="w-12 h-12 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold">Private Profile</h2>
          <p className="text-muted-foreground text-sm">@{username}</p>
          <p className="text-sm text-muted-foreground">This profile is set to private.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/"><LogoWithGlow size="md" /></Link>
          <span className="text-lg font-bold hidden sm:inline">Student Profile</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-secondary border-4 border-primary/30 overflow-hidden mb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {(profile.full_name || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold">{profile.full_name || "Anonymous"}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${planBadge(profile.subscription_tier)}`}>
              {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-primary/20 text-primary">
              Level {level}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card-gradient rounded-xl p-4 border border-border text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{profile.total_points || 0}</p>
            <p className="text-[10px] text-muted-foreground">Total XP</p>
          </div>
          <div className="card-gradient rounded-xl p-4 border border-border text-center">
            <Award className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-xl font-bold">{badges.length}</p>
            <p className="text-[10px] text-muted-foreground">Badges</p>
          </div>
          <div className="card-gradient rounded-xl p-4 border border-border text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xl font-bold">{coursesCompleted}</p>
            <p className="text-[10px] text-muted-foreground">Lessons Done</p>
          </div>
          <div className="card-gradient rounded-xl p-4 border border-border text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xl font-bold">{referralCount}</p>
            <p className="text-[10px] text-muted-foreground">Referred</p>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="card-gradient rounded-xl p-4 border border-border mb-6">
            <h3 className="font-semibold text-sm mb-3">Earned Badges</h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b.id} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {b.badge_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Member since */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <Calendar className="w-4 h-4" />
          <span>Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>

        {/* Share Button */}
        <div className="text-center">
          <Button variant="outline" className="gap-2" onClick={handleShare}>
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Share Profile"}
          </Button>
        </div>
      </main>
    </div>
  );
}
