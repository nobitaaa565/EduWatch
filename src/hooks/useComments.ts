import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Comment } from '../types';

function buildCommentTree(rows: any[]): Comment[] {
  const comments: Comment[] = [];
  const map = new Map<string, Comment>();

  rows.forEach(row => {
    const comment: Comment = {
      id: row.id,
      authorId: row.author_id,
      authorName: row.users?.full_name || 'Unknown',
      authorImage: row.users?.avatar_url || '',
      text: row.content,
      createdAt: row.created_at,
      likes: 0,
      replies: [],
    };
    map.set(comment.id, comment);
  });

  rows.forEach(row => {
    const comment = map.get(row.id)!;
    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id)!.replies.push(comment);
    } else {
      comments.push(comment);
    }
  });

  return comments;
}

export function useComments(postId?: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('*, users!inner(full_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return buildCommentTree(data || []);
    },
    enabled: !!postId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      authorId,
      content,
      parentId,
    }: {
      postId: string;
      authorId: string;
      content: string;
      parentId?: string;
    }) => {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: authorId,
        content,
        parent_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
    },
  });
}
