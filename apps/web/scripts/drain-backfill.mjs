#!/usr/bin/env node
/**
 * Drains a BITS pending-backfill pool by hammering the dedicated route in a loop
 * until `remaining` hits 0. Used to catch up the deep layer (exact per-player
 * results / 2v2 delmatch) after the 2008–2020 history backfill added ~141k
 * matches to each pool. Idempotent + resumable — safe to re-run any time.
 *
 *   node scripts/drain-backfill.mjs exact     [limit]   (default limit 300)
 *   node scripts/drain-backfill.mjs delmatch  [limit]
 */
import { readFileSync } from 'fs'

const kind = process.argv[2]
const limit = Number(process.argv[3] ?? 300)
if (kind !== 'exact' && kind !== 'delmatch') { console.error('usage: drain-backfill.mjs <exact|delmatch> [limit]'); process.exit(1) }

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const S = env.CRON_SECRET
const url = `https://bowlkollen.se/api/cron/backfill-${kind}?limit=${limit}`

const started = Date.now()
let totalSynced = 0, iterations = 0, consecErrors = 0
console.log(`[${kind}] draining via ${url}`)

while (true) {
  iterations++
  try {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${S}` } })
    if (r.status !== 200) { console.log(`[${kind}] HTTP ${r.status} — retrying in 5s`); await sleep(5000); continue }
    const j = await r.json()
    totalSynced += j.synced ?? 0
    const mins = ((Date.now() - started) / 60000).toFixed(1)
    if (j.errors?.length) { consecErrors++; console.log(`[${kind}] iter ${iterations}: err ${j.errors[0]?.slice(0, 80)} | remaining=${j.remaining}`) }
    else consecErrors = 0
    if (iterations % 10 === 0 || j.remaining === 0) console.log(`[${kind}] iter ${iterations} | +${j.synced} (tot ${totalSynced}) | remaining=${j.remaining} | ${mins}min`)
    if (j.remaining === 0) { console.log(`[${kind}] DONE — remaining 0 after ${iterations} iters, ${mins}min`); break }
    // A run that makes no progress AND has no errors would loop forever — guard it.
    if (consecErrors > 20) { console.log(`[${kind}] ABORT — ${consecErrors} consecutive errored iters`); process.exit(1) }
  } catch (e) {
    console.log(`[${kind}] fetch error: ${String(e).slice(0, 100)} — retrying in 5s`); await sleep(5000)
  }
}
function sleep(ms) { return new Promise(res => setTimeout(res, ms)) }
