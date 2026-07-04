import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useFollowers(userId?: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('followee_id', userId);

      if (error) throw error;
      return (data || []).map(f => f.follower_id);
    },
    enabled: !!userId,
  });
}

export function useFollowing(userId?: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', userId);

      if (error) throw error;
      return (data || []).map(f => f.followee_id);
    },
    enabled: !!userId,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followerId, followeeId }: { followerId: string; followeeId: string }) => {
      const { data: existing } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('followee_id', followeeId)
        .single();

      if (existing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('followee_id', followeeId);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: followerId, followee_id: followeeId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
}
