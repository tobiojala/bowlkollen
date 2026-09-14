import { NextResponse } from 'next/server'
import { syncBowwwlBalls } from '@/lib/bowwwl-sync'

// Sync the bowwwl.com ball catalog into bowling_balls. Auth with $CRON_SECRET (Bearer),
// same as the other cron routes. Small dataset → runs in seconds; schedule it weekly via
// pg_cron, or POST it manually after deploy to seed. Attribution is shown in-app.
export const dynamic = 'force-dynamic'
export const maxDuration = 120

function authed(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  const bearer = (req.headers.get('authorization') ?? '') === `Bearer ${secret}`
  const token = new URL(req.url).searchParams.get('token') === secret
  return !!secret && (bearer || token)
}

async function run(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const res = await syncBowwwlBalls()
    return NextResponse.json({ ok: res.errors.length === 0, ...res }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 })
  }
}

export const GET = run
export const POST = run
