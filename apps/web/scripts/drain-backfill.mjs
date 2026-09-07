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
let totalSynced = 0, iterations = 0, noProgress = 0, lastRemaining = Infinity
console.log(`[${kind}] draining via ${url}`)

while (true) {
  iterations++
  try {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${S}` } })
    if (r.status !== 200) { console.log(`[${kind}] HTTP ${r.status} — retrying in 5s`); await sleep(5000); continue }
    const j = await r.json()
    totalSynced += j.synced ?? 0
    const mins = ((Date.now() - started) / 60000).toFixed(1)
    // Old matches often throw a transient BITS 500 on a single match while the
    // rest of the batch still commits — so abort on lack of PROGRESS, never on
    // errors alone. `remaining` dropping = real progress.
    if (typeof j.remaining === 'number' && j.remaining < lastRemaining) { noProgress = 0; lastRemaining = j.remaining }
    else noProgress++
    if (iterations % 10 === 0 || j.remaining === 0 || j.errors?.length) {
      console.log(`[${kind}] iter ${iterations} | +${j.synced} (tot ${totalSynced}) | remaining=${j.remaining} | ${mins}min${j.errors?.length ? ` | e.g. ${j.errors[0]?.slice(0, 60)}` : ''}`)
    }
    if (j.remaining === 0) { console.log(`[${kind}] DONE — remaining 0 after ${iterations} iters, ${mins}min`); break }
    if (noProgress > 15) { console.log(`[${kind}] ABORT — ${noProgress} iters with no drop in remaining (stuck at ${lastRemaining})`); process.exit(1) }
  } catch (e) {
    console.log(`[${kind}] fetch error: ${String(e).slice(0, 100)} — retrying in 5s`); await sleep(5000)
  }
}
function sleep(ms) { return new Promise(res => setTimeout(res, ms)) }
