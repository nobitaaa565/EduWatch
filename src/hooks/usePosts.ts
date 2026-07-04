import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Post } from '../types';

interface PostRow {
  id: string;
  author_id: string;
  title: string;
  subtitle: string | null;
  content: string;
  format: string;
  privacy: string;
  media_urls: string[];
  communities: string[];
  categories: string[];
  tagged_users: string[];
  location: string | null;
  comments_enabled: boolean;
  created_at: string;
  updated_at: string;
}

function mapPostToInterface(row: PostRow, author: { full_name: string; username: string; avatar_url: string }): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: author.full_name,
    authorImage: author.avatar_url,
    title: row.title,
    subtitle: row.subtitle || undefined,
    content: row.content,
    images: row.media_urls.length > 0 ? row.media_urls : undefined,
    mediaUrls: row.media_urls,
    format: row.format as 'article' | 'micropost',
    privacy: row.privacy as 'public' | 'followers' | 'communities',
    communities: row.communities,
    categories: row.categories,
    readTime: Math.max(1, Math.ceil(row.content.split(/\s+/).length / 200)),
    words: row.content.split(/\s+/).length,
    createdAt: row.created_at,
    likes: 0,
    upvotes: 0,
    downvotes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    location: row.location || undefined,
    commentsEnabled: row.comments_enabled,
  };
}

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('posts')
        .select('*, users!inner(full_name, username, avatar_url)')
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!rows) return [];

      return rows.map((row: any) => mapPostToInterface(row, row.users));
    },
  });
}

export function usePost(id?: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) return null;
      const { data: row, error } = await supabase
        .from('posts')
        .select('*, users!inner(full_name, username, avatar_url)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!row) return null;

      return mapPostToInterface(row, row.users);
    },
    enabled: !!id,
  });
}

export function useUserPosts(authorId?: string) {
  return useQuery({
    queryKey: ['userPosts', authorId],
    queryFn: async () => {
      if (!authorId) return [];
      const { data: rows, error } = await supabase
        .from('posts')
        .select('*, users!inner(full_name, username, avatar_url)')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!rows) return [];

      return rows.map((row: any) => mapPostToInterface(row, row.users));
    },
    enabled: !!authorId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: {
      authorId: string;
      title: string;
      content: string;
      format: 'article' | 'micropost';
      privacy?: string;
      categories?: string[];
      mediaUrls?: string[];
    }) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: post.authorId,
          title: post.title,
          content: post.content,
          format: post.format,
          privacy: post.privacy || 'public',
          categories: post.categories || [],
          media_urls: post.mediaUrls || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, voteType }: { postId: string; userId: string; voteType: 'up' | 'down' }) => {
      const { data: existing } = await supabase
        .from('post_votes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        if (existing.vote_type === voteType) {
          await supabase
            .from('post_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);
        } else {
          await supabase
            .from('post_votes')
            .update({ vote_type: voteType })
            .eq('post_id', postId)
            .eq('user_id', userId);
        }
      } else {
        await supabase
          .from('post_votes')
          .insert({ post_id: postId, user_id: userId, vote_type: voteType });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId: string }) => {
      const { data: existing } = await supabase
        .from('post_bookmarks')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        await supabase
          .from('post_bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('post_bookmarks')
          .insert({ post_id: postId, user_id: userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useBookmarkedPosts(userId?: string) {
  return useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('post_bookmarks')
        .select('post_id')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map(b => b.post_id);
    },
    enabled: !!userId,
  });
}
