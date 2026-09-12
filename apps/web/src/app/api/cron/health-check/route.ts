import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { getDivisions } from '@/lib/bits-series'

// Watchdog: every 30 min (Vercel Cron) actively probe BITS + check that the sync
// ran recently, and push an alert to ALERT_WEBHOOK_URL (a Slack or Discord
// incoming webhook) when something's wrong — so a block/outage is a notification
// in minutes, not a silent 3-week gap. De-spammed: alerts on the transition into
// trouble and re-alerts at most every 6h while still down, plus a recovery notice.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SYNC_STALE_MINUTES = 8 * 60      // sync is every 3h → ~2 missed cycles
const REALERT_MS = 6 * 60 * 60 * 1000  // while still down, remind at most every 6h

function authed(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  const token = new URL(req.url).searchParams.get('token')
  const auth = req.headers.get('authorization') ?? ''
  return !!secret && (auth === `Bearer ${secret}` || token === secret)
}

async function notify(text: string) {
  const url = process.env.ALERT_WEBHOOK_URL
  if (!url) return false
  try {
    // Slack reads `text`, Discord reads `content` — send both so either works.
    await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, content: text }) })
    return true
  } catch { return false }
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceSupabase() as unknown as SupabaseClient
  const now = new Date()
  const season = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  const reasons: string[] = []

  // 1. Active BITS probe — catches a block in real time, independent of the sync.
  try {
    const divs = await getDivisions(season)
    if (!divs.length) reasons.push('BITS reachable but returned no divisions')
  } catch (e) {
    reasons.push(`BITS unreachable/blocked: ${String(e)}`)
  }

  // 2. Sync freshness — last bits run recent and ok?
  const lastBits = await db.from('sync_runs').select('ran_at, ok').eq('kind', 'bits').order('ran_at', { ascending: false }).limit(1).maybeSingle()
  const ranAt = lastBits.data?.ran_at ? new Date(lastBits.data.ran_at) : null
  const ageMin = ranAt ? Math.round((Date.now() - ranAt.getTime()) / 60000) : null
  if (ageMin == null) reasons.push('no bits sync has ever run')
  else if (ageMin > SYNC_STALE_MINUTES) reasons.push(`sync stale — last ran ${Math.round(ageMin / 60)}h ago`)
  if (lastBits.data?.ok === false) reasons.push('last sync run reported errors')

  const healthy = reasons.length === 0

  // 3. De-spam against the previous health check.
  const prev = await db.from('sync_runs').select('ran_at, ok').eq('kind', 'health').order('ran_at', { ascending: false }).limit(1).maybeSingle()
  const prevOk = prev.data?.ok
  const prevAt = prev.data?.ran_at ? new Date(prev.data.ran_at).getTime() : 0
  const alertDown = !healthy && (prevOk !== false || Date.now() - prevAt > REALERT_MS)
  const alertRecovered = healthy && prevOk === false

  let notified = false
  if (alertDown) notified = await notify(`Bowlkollen BITS UNHEALTHY: ${reasons.join('; ')}. Health: https://bowlkollen.se/api/health/bits`)
  else if (alertRecovered) notified = await notify('Bowlkollen BITS recovered — sync and BITS access are healthy again.')

  await db.from('sync_runs').insert({ kind: 'health', ok: healthy, summary: { reasons, ageMin, notified } })
  return NextResponse.json({ healthy, reasons, ageMin, notified }, { status: healthy ? 200 : 503 })
}
