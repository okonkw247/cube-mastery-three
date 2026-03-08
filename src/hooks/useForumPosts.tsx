import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ForumPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
  author_xp?: number;
  reply_count?: number;
}

export function useForumPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    // Fetch top-level posts
    const { data: postsData } = await supabase
      .from('forum_posts')
      .select('*')
      .is('parent_id', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (!postsData) { setLoading(false); return; }

    // Get unique user IDs
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    
    // Fetch profiles for those users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, total_points')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Count replies per post
    const postIds = postsData.map(p => p.id);
    const { data: replies } = await supabase
      .from('forum_posts')
      .select('parent_id')
      .in('parent_id', postIds);

    const replyCountMap = new Map<string, number>();
    replies?.forEach(r => {
      if (r.parent_id) replyCountMap.set(r.parent_id, (replyCountMap.get(r.parent_id) || 0) + 1);
    });

    const enriched: ForumPost[] = postsData.map(p => {
      const profile = profileMap.get(p.user_id);
      return {
        ...p,
        author_name: profile?.full_name || 'Anonymous',
        author_avatar: profile?.avatar_url || undefined,
        author_xp: profile?.total_points || 0,
        reply_count: replyCountMap.get(p.id) || 0,
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('forum-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () => {
        fetchPosts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const createPost = useCallback(async (title: string, content: string, parentId?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({ user_id: user.id, title, content, parent_id: parentId || null })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [user]);

  const getReplies = useCallback(async (postId: string) => {
    const { data: repliesData } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('parent_id', postId)
      .order('created_at', { ascending: true });

    if (!repliesData) return [];

    const userIds = [...new Set(repliesData.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, total_points')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    return repliesData.map(r => ({
      ...r,
      author_name: profileMap.get(r.user_id)?.full_name || 'Anonymous',
      author_avatar: profileMap.get(r.user_id)?.avatar_url || undefined,
      author_xp: profileMap.get(r.user_id)?.total_points || 0,
    }));
  }, []);

  return { posts, loading, createPost, getReplies, refetch: fetchPosts };
}
