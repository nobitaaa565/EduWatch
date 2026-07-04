import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .rpc('search_posts', {
          search_query: query.trim(),
          result_limit: 50,
          result_offset: 0,
        });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        authorId: row.author_id,
        authorName: row.author_name,
        authorImage: row.author_avatar,
        title: row.title || '',
        content: row.content || '',
        format: row.format as 'article' | 'micropost',
        privacy: 'public' as const,
        readTime: Math.max(1, Math.ceil((row.content || '').split(/\s+/).length / 200)),
        words: (row.content || '').split(/\s+/).length,
        createdAt: row.created_at,
        likes: 0,
        upvotes: 0,
        downvotes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        commentsEnabled: true,
      }));
    },
    enabled: query.trim().length > 0,
    staleTime: 1000 * 30,
  });
}
