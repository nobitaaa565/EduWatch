import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCurrentUserId() {
  return useQuery({
    queryKey: ['currentUserId'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      return data?.id || null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });
}

export function useUserByUsername(username?: string) {
  return useQuery({
    queryKey: ['userByUsername', username],
    queryFn: async () => {
      if (!username) return null;
      const { data } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username)
        .single();
      return data;
    },
    enabled: !!username,
  });
}

export function useUserStats(userId?: string) {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, ...updates }: { userId: string; [key: string]: any }) => {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.userId] });
    },
  });
}
