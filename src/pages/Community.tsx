import { useState, useEffect } from "react";
import { useForumPosts, ForumPost } from "@/hooks/useForumPosts";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useXP } from "@/hooks/useXP";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Pin, Send, ChevronDown, ChevronUp, Trophy, Lock, Crown, Megaphone, Trash2, ExternalLink, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Whop community — paid members only
const WHOP_COMMUNITY_URL = "https://whop.com/jsn-cubing";

function ReplySection({ postId }: { postId: string }) {
  const [replies, setReplies] = useState<ForumPost[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const { getReplies, createPost } = useForumPosts();
  const { user } = useAuth();
  const { isFree } = useProfile();
  const { awardXP } = useXP();

  const loadReplies = async () => {
    if (!expanded) {
      setLoading(true);
      const data = await getReplies(postId);
      setReplies(data as ForumPost[]);
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    try {
      await createPost("Reply", replyText.trim(), postId);
      await awardXP("forum_post");
      setReplyText("");
      const data = await getReplies(postId);
      setReplies(data as ForumPost[]);
      toast.success("Reply posted!");
    } catch {
      toast.error("Failed to post reply");
    }
  };

  return (
    <div className="mt-3">
      <button onClick={loadReplies} className="text-xs text-primary hover:underline flex items-center gap-1">
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Hide replies" : "Show replies"}
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-border">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : replies.length === 0 ? (
            <p className="text-xs text-muted-foreground">No replies yet</p>
          ) : (
            replies.map(r => (
              <div key={r.id} className="bg-secondary/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">{r.author_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{r.content}</p>
              </div>
            ))
          )}
          {user && !isFree && (
            <div className="flex gap-2 mt-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] text-sm"
              />
              <Button size="icon" onClick={submitReply} disabled={!replyText.trim()} className="shrink-0 self-end">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommunitySkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Community() {
  const { posts, loading, createPost, getReplies, refetch } = useForumPosts();
  const { user } = useAuth();
  const { profile, isFree, isPro } = useProfile();
  const { isAdmin } = useAdmin();
  const { awardXP } = useXP();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [realtimePosts, setRealtimePosts] = useState<ForumPost[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Sync posts from hook
  useEffect(() => {
    setRealtimePosts(posts);
  }, [posts]);

  // Realtime subscription for new forum posts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('community-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'forum_posts' },
        (payload) => {
          const newPost = payload.new as any;
          // Only add top-level posts (not replies)
          if (!newPost.parent_id) {
            setRealtimePosts(prev => {
              if (prev.find(p => p.id === newPost.id)) return prev;
              return [{
                ...newPost,
                author_name: 'New User',
                author_avatar: null,
                author_xp: 0,
                reply_count: 0,
              }, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'forum_posts' },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setRealtimePosts(prev => prev.filter(p => p.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  const canPost = isPro || isAdmin;
  const hasAccess = isPro || isAdmin;

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setPosting(true);
    try {
      await createPost(newTitle.trim(), newContent.trim());
      await awardXP("forum_post");
      setNewTitle("");
      setNewContent("");
      setShowForm(false);
      toast.success("Post created! +15 XP 🎉");
    } catch {
      toast.error("Failed to create post");
    }
    setPosting(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const { error } = await supabase.from('forum_posts').delete().eq('id', postId);
      if (error) throw error;
      setRealtimePosts(prev => prev.filter(p => p.id !== postId));
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handlePin = async (postId: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from('forum_posts')
      .update({ is_pinned: !currentPinned })
      .eq('id', postId);
    if (error) {
      toast.error("Failed to update pin");
    } else {
      setRealtimePosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !currentPinned } : p));
      toast.success(currentPinned ? "Unpinned" : "Pinned");
    }
  };

  // Locked screen for free users
  if (isFree && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <LogoWithGlow size="md" />
              <span className="text-lg font-bold hidden sm:inline">Community</span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-12 max-w-lg text-center">
          <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Community Access Locked</h1>
            <p className="text-muted-foreground">
              Upgrade to <span className="font-semibold text-primary">Sub 20 Mastery</span> to join discussions, share tips, and connect with fellow cubers.
            </p>
            <div className="space-y-2 text-sm text-left bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2"><Crown className="w-4 h-4 text-primary" /> Post threads & replies</div>
              <div className="flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> Get announcements first</div>
              <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Private Discord community</div>
              <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Earn XP for participation</div>
            </div>
            <Button onClick={() => setUpgradeOpen(true)} className="w-full gap-2" size="lg">
              <Crown className="w-4 h-4" /> Upgrade to Unlock
            </Button>
          </div>
        </main>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </div>
    );
  }

  // Sort: pinned first, then by date
  const sortedPosts = [...realtimePosts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <LogoWithGlow size="md" />
              <span className="text-lg font-bold hidden sm:inline">Community</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-3xl">
        {/* Whop Community Hero — premium gradient card */}
        <div className="relative rounded-2xl p-[1.5px] gradient-sweep mb-6 shadow-[0_8px_40px_-12px_hsl(175_80%_50%/0.4)]">
          <div className="relative rounded-[14px] bg-[hsl(220_22%_6%/0.95)] backdrop-blur-xl p-5 sm:p-7 overflow-hidden">
            <div className="pointer-events-none absolute -inset-px opacity-70"
                 style={{ background: "radial-gradient(700px circle at 100% 0%, hsl(175 80% 50% / 0.18), transparent 45%)" }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-primary">Members Only</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground">Whop</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">Join JSN Cubing on Whop</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Live drills, weekly challenges, and direct access to the team.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.open(WHOP_COMMUNITY_URL, '_blank', 'noopener,noreferrer')}
                className="btn-shine relative overflow-hidden gap-2 px-5 h-10 font-semibold rounded-xl bg-gradient-to-br from-primary to-[hsl(190_90%_45%)] text-primary-foreground hover:shadow-[0_0_28px_-4px_hsl(175_80%_50%/0.6)] hover:scale-[1.02] transition-all shrink-0"
              >
                <span className="relative z-10">Join Community on Whop</span>
                <ExternalLink className="w-4 h-4 relative z-10" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Community Forum</h1>
            <p className="text-sm text-muted-foreground">Share tips, ask questions, and connect with cubers</p>
          </div>
          {canPost && (
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              New Post
            </Button>
          )}
        </div>

        {/* New post form */}
        {showForm && canPost && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
            <Input
              placeholder="Post title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Share your thoughts, tips, or questions..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handlePost} disabled={posting || !newTitle.trim() || !newContent.trim()}>
                {posting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <CommunitySkeleton />
        ) : sortedPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No posts yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPosts.map(post => (
              <div key={post.id} className={`bg-card border rounded-xl p-4 hover:border-primary/30 transition-colors ${post.is_pinned ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      post.author_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                      <h3 className="font-semibold text-sm">{post.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{post.author_name}</span>
                      <span className="text-xs text-primary flex items-center gap-0.5">
                        <Trophy className="w-3 h-3" /> {post.author_xp || 0} XP
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-2 text-foreground/80">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {post.reply_count || 0} replies
                      </span>
                      {/* Admin actions */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handlePin(post.id, post.is_pinned)}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <Pin className="w-3 h-3" /> {post.is_pinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                    <ReplySection postId={post.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
