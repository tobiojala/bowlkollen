import 'server-only'

// The one choke point for every BITS request. Two jobs, both about never getting
// locked out again:
//   1. Rate limit — serialize calls (max 1 in flight) with a minimum gap, so we
//      behave like a person browsing, never a burst of parallel scrapers.
//   2. Circuit breaker — after a few 403/429s (the shape of a block) we OPEN the
//      breaker and refuse all BITS calls for a cooldown, instead of hammering into
//      the block. It half-opens automatically after the cooldown.
// 5xx get a couple of jittered retries; 401 is left to the caller (session
// refresh). State is readable via bitsBreakerState() for /api/health/bits.

const MIN_GAP_MS = 700          // ≈1.4 req/s — gentle, browser-like
const BLOCK_TRIP = 3            // consecutive 403/429 before the breaker opens
const COOLDOWN_MS = 15 * 60_000 // how long the breaker stays open
const MAX_RETRIES = 2           // for 5xx only

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const backoff = (attempt: number) => 400 * 2 ** attempt + Math.floor(Math.random() * 250)

type Breaker = { openUntil: number; consecutiveBlocks: number; lastError: string | null; lastOkAt: number | null; totalBlocks: number }
const breaker: Breaker = { openUntil: 0, consecutiveBlocks: 0, lastError: null, lastOkAt: null, totalBlocks: 0 }

export function bitsBreakerState() {
  const now = Date.now()
  return {
    open: now < breaker.openUntil,
    cooldownSecondsLeft: Math.max(0, Math.ceil((breaker.openUntil - now) / 1000)),
    consecutiveBlocks: breaker.consecutiveBlocks,
    totalBlocks: breaker.totalBlocks,
    lastError: breaker.lastError,
    lastOkAt: breaker.lastOkAt ? new Date(breaker.lastOkAt).toISOString() : null,
  }
}

// Serialize everything through one promise chain + a min-gap clock.
let chain: Promise<unknown> = Promise.resolve()
let lastAt = 0
function gate<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = MIN_GAP_MS - (Date.now() - lastAt)
    if (wait > 0) await sleep(wait)
    lastAt = Date.now()
    return fn()
  })
  chain = run.then(() => undefined, () => undefined) // keep the chain alive past errors
  return run
}

export class BitsCircuitOpenError extends Error {}

export async function bitsFetch(url: string, init: RequestInit): Promise<Response> {
  if (Date.now() < breaker.openUntil) {
    throw new BitsCircuitOpenError(`BITS circuit open (${bitsBreakerState().cooldownSecondsLeft}s left) — last: ${breaker.lastError}`)
  }
  return gate(async () => {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, init)
      if (res.status === 403 || res.status === 429) {
        breaker.consecutiveBlocks++
        breaker.totalBlocks++
        breaker.lastError = `HTTP ${res.status} ${new URL(url).pathname}`
        if (breaker.consecutiveBlocks >= BLOCK_TRIP) breaker.openUntil = Date.now() + COOLDOWN_MS
        return res // caller sees the status; the breaker now guards the next call
      }
      if (res.status >= 500 && attempt < MAX_RETRIES) { await sleep(backoff(attempt)); continue }
      if (res.status !== 401) { breaker.consecutiveBlocks = 0; breaker.lastOkAt = Date.now() } // 401 = session, not a block
      return res
    }
  })
}
