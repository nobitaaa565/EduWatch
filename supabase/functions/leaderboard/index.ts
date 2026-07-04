import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '100')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUP_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase
    .from('user_stats')
    .select('user_id, knowledge_score, edu_impact, priority_score, contributor_rank, global_rank, follower_count, post_count')
    .order('global_rank', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: users } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url')
    .in('id', (data || []).map(s => s.user_id))

  const userMap = new Map((users || []).map(u => [u.id, u]))

  const leaderboard = (data || []).map(entry => ({
    ...entry,
    username: userMap.get(entry.user_id)?.username,
    full_name: userMap.get(entry.user_id)?.full_name,
    avatar_url: userMap.get(entry.user_id)?.avatar_url,
  }))

  return new Response(JSON.stringify(leaderboard), {
    headers: { 'Content-Type': 'application/json' },
  })
})
