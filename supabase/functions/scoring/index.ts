import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUP_SERVICE_ROLE_KEY')!
  )

  await supabase.rpc('recalculate_all_scores')
  await supabase.rpc('recalculate_leaderboard')

  return new Response('scoring complete')
})
