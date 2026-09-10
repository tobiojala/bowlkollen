import { NextResponse } from 'next/server'
import { syncBitsPlayerRanking } from '@/lib/bits-ranking-sync'

// Pulls the full BITS national ranking (~15k players) into bits_player_ranking.
// Bearer $CRON_SECRET. Trigger to populate now; also runs daily via bits-sync.
export const dynamic = 'force-dynamic'
export const maxDuration = 240

function authed(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  return !!secret && (req.headers.get('authorization') ?? '') === `Bearer ${secret}`
}

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await syncBitsPlayerRanking())
}
export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await syncBitsPlayerRanking())
}
