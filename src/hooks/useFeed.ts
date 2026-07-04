import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Post } from '../types';

function mapRowToPost(row: any): Post {
  return {
    id: row.post_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorImage: row.author_avatar,
    title: row.title || '',
    content: row.content || '',
    format: row.format as 'article' | 'micropost',
    privacy: 'public',
    readTime: Math.max(1, Math.ceil((row.content || '').split(/\s+/).length / 200)),
    words: (row.content || '').split(/\s+/).length,
    createdAt: row.created_at,
    likes: Number(row.upvotes) || 0,
    upvotes: Number(row.upvotes) || 0,
    downvotes: Number(row.downvotes) || 0,
    comments: Number(row.comment_count) || 0,
    shares: 0,
    saves: 0,
    commentsEnabled: true,
  };
}

export function useFeed(userId?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', userId],
    queryFn: async ({ pageParam = new Date().toISOString() }) => {
      if (!userId) return { posts: [], nextCursor: null };

      const { data, error } = await supabase
        .rpc('get_feed', {
          p_user_id: userId,
          p_cursor: pageParam,
          p_limit: 20,
        });

      if (error) throw error;

      const posts = (data || []).map(mapRowToPost);
      const nextCursor = posts.length === 20 ? posts[posts.length - 1].createdAt : null;

      return { posts, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: new Date().toISOString(),
    enabled: !!userId,
  });
}

export function useGlobalFeed() {
  return useInfiniteQuery({
    queryKey: ['globalFeed'],
    queryFn: async ({ pageParam = new Date().toISOString() }) => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users!inner(full_name, username, avatar_url)')
        .eq('privacy', 'public')
        .lt('created_at', pageParam)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const posts = (data || []).map((row: any) => ({
        id: row.id,
        authorId: row.author_id,
        authorName: row.users.full_name,
        authorImage: row.users.avatar_url,
        title: row.title || '',
        content: row.content || '',
        format: row.format as 'article' | 'micropost',
        privacy: row.privacy,
        readTime: Math.max(1, Math.ceil((row.content || '').split(/\s+/).length / 200)),
        words: (row.content || '').split(/\s+/).length,
        createdAt: row.created_at,
        likes: 0,
        upvotes: 0,
        downvotes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        commentsEnabled: row.comments_enabled,
      }));

      const nextCursor = posts.length === 20 ? posts[posts.length - 1].createdAt : null;
      return { posts, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: new Date().toISOString(),
  });
}
