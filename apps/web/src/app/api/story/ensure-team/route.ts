import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { syncBitsTeamEvents } from '@/lib/sync-bits-team-events'

// Lazy story generation: any logged-in visitor to a team page triggers a sync
// for that team, so a followed team always has fresh events without waiting for
// the daily cron. Idempotent + current-season only, so it's cheap.
export const maxDuration = 30

export async function POST(req: Request) {
  const teamId = Number(new URL(req.url).searchParams.get('team'))
  if (!teamId) return NextResponse.json({ error: 'bad_team' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const events = await syncBitsTeamEvents(teamId)
    return NextResponse.json({ ok: true, events })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
