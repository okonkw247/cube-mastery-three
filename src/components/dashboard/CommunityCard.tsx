import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Lock, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { UpgradeModal } from '@/components/modals/UpgradeModal';

interface LatestPost {
  id: string;
  title: string;
  author_name: string;
}

export function CommunityCard() {
  const { user } = useAuth();
  const { profile, isFree, isPro, isStarter } = useProfile();
  const [latestPosts, setLatestPosts] = useState<LatestPost[]>([]);
  const [userPostCount, setUserPostCount] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const hasPaidAccess = isPro || isStarter;

  useEffect(() => {
    fetchLatestPosts();
    if (user && hasPaidAccess) fetchUserPostCount();
  }, [user, hasPaidAccess]);

  const fetchLatestPosts = async () => {
    const { data: posts } = await supabase
      .from('forum_posts')
      .select('id, title, user_id')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!posts) return;

    const userIds = [...new Set(posts.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

    setLatestPosts(posts.map(p => ({
      id: p.id,
      title: p.title,
      author_name: profileMap.get(p.user_id) || 'Anonymous',
    })));
  };

  const fetchUserPostCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('forum_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setUserPostCount(count || 0);
  };

  const handleCommunityClick = () => {
    if (isFree) {
      setUpgradeOpen(true);
    }
  };

  return (
    <>
      <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border h-full relative">
        {/* Lock badge for free users */}
        {isFree && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] sm:text-xs gap-1">
              <Lock className="w-3 h-3" />
              Locked
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base">Community 💬</h2>
            {hasPaidAccess && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {userPostCount} post{userPostCount !== 1 ? 's' : ''} by you
              </p>
            )}
          </div>
        </div>

        {/* Latest posts preview */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
          {latestPosts.length > 0 ? latestPosts.map(post => (
            <div key={post.id} className="flex items-start gap-2 p-2 sm:p-2.5 rounded-lg bg-secondary/50">
              <Users className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{post.title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">by {post.author_name}</p>
              </div>
            </div>
          )) : (
            <p className="text-xs sm:text-sm text-muted-foreground">No posts yet — be the first!</p>
          )}
        </div>

        {/* CTA */}
        {isFree ? (
          <Button
            variant="outline"
            className="w-full text-xs sm:text-sm gap-1.5"
            onClick={handleCommunityClick}
          >
            <Lock className="w-3.5 h-3.5" />
            Upgrade to join the conversation 💬
          </Button>
        ) : (
          <Link to="/community" className="block">
            <Button variant="outline" className="w-full text-xs sm:text-sm gap-1.5">
              Go to Community
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
