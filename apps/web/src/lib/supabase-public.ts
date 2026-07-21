import { createClient } from '@supabase/supabase-js'

// Cookie-free Supabase client for server-side public data fetching.
// Does not call cookies() — allows pages using it to opt into ISR/static generation.
// Use for: team, player, match prefetches that don't require auth.
// Use createServerSupabase() when you need to read the auth session.
export function createPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
