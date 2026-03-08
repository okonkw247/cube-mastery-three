import { useState } from "react";
import { useForumPosts, ForumPost } from "@/hooks/useForumPosts";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useXP } from "@/hooks/useXP";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Pin, Send, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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

export default function Community() {
  const { posts, loading, createPost } = useForumPosts();
  const { user } = useAuth();
  const { isFree } = useProfile();
  const { awardXP } = useXP();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Community Forum</h1>
            <p className="text-sm text-muted-foreground">Share tips, ask questions, and connect with cubers</p>
          </div>
          {!isFree ? (
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              New Post
            </Button>
          ) : (
            <Button onClick={() => setUpgradeOpen(true)} variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Upgrade to Post
            </Button>
          )}
        </div>

        {/* Free user banner */}
        {isFree && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 text-center">
            <p className="font-semibold text-sm">Upgrade your plan to post in the community 💬</p>
            <Button size="sm" className="mt-2" onClick={() => setUpgradeOpen(true)}>Upgrade Now</Button>
          </div>
        )}

        {/* New post form */}
        {showForm && !isFree && (
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
          <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No posts yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
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
