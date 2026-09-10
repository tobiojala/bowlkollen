import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { getPlayerRankingGraph } from '@/lib/bits-ranking'

// A player's 12-month ranking history for the profile curve. Resolves public_id →
// lic_nbr SERVER-SIDE (lic_nbr never leaves the server) then pulls the monthly
// series from BITS. Public data → edge-cached for a day to keep BITS load low and
// repeat views instant. Empty array on any miss so the UI degrades gracefully.
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const db = createServiceSupabase() as unknown as SupabaseClient
    const { data } = await db.from('bits_players').select('lic_nbr').eq('public_id', id).maybeSingle()
    const lic = (data as { lic_nbr?: string } | null)?.lic_nbr
    if (!lic) return NextResponse.json([])

    const series = await getPlayerRankingGraph(lic)
    return NextResponse.json(series, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' },
    })
  } catch {
    return NextResponse.json([])
  }
}
