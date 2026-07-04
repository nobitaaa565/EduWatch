import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record } = await req.json()
  if (!record || !record.author_id) {
    return new Response('missing payload', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUP_SERVICE_ROLE_KEY')!
  )

  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('followee_id', record.author_id)

  const entries = (followers || []).map(f => ({
    user_id: f.follower_id,
    post_id: record.id,
    author_id: record.author_id,
  }))

  entries.push({
    user_id: record.author_id,
    post_id: record.id,
    author_id: record.author_id,
  })

  for (let i = 0; i < entries.length; i += 500) {
    const { error } = await supabase
      .from('feed_entries')
      .insert(entries.slice(i, i + 500))
    if (error) console.error('feed fan-out insert error:', error)
  }

  return new Response('ok')
})
