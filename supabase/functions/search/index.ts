import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const url = new URL(req.url)
  const query = url.searchParams.get('q') || ''
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  if (!query.trim()) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUP_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase
    .rpc('search_posts', {
      search_query: query.trim(),
      result_limit: limit,
      result_offset: offset,
    })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(data || []), {
    headers: { 'Content-Type': 'application/json' },
  })
})
