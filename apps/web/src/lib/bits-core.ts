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

const MIN_GAP_MS = 250          // 4 req/s — gentle (a page load fires more), but the
                               // sync makes ~110 calls/run and must fit maxDuration
const BLOCK_TRIP = 3            // consecutive 403/429 before the breaker opens
const COOLDOWN_MS = 15 * 60_000 // how long the breaker stays open
const MAX_RETRIES = 2           // for 5xx only

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const backoff = (attempt: number) => 400 * 2 ** attempt + Math.floor(Math.random() * 250)

// Breaker is PER-HOST: the dead api.swebowl.se must never trip the breaker for the
// working bits.swebowl.se (scores/ranking) or vice-versa.
type Breaker = { openUntil: number; consecutiveBlocks: number; lastError: string | null; lastOkAt: number | null; totalBlocks: number }
const breakers = new Map<string, Breaker>()
const forHost = (host: string): Breaker => {
  let b = breakers.get(host)
  if (!b) { b = { openUntil: 0, consecutiveBlocks: 0, lastError: null, lastOkAt: null, totalBlocks: 0 }; breakers.set(host, b) }
  return b
}

export function bitsBreakerState() {
  const now = Date.now()
  const hosts: Record<string, unknown> = {}
  let anyOpen = false
  for (const [host, b] of breakers) {
    const open = now < b.openUntil
    anyOpen = anyOpen || open
    hosts[host] = {
      open, cooldownSecondsLeft: Math.max(0, Math.ceil((b.openUntil - now) / 1000)),
      consecutiveBlocks: b.consecutiveBlocks, totalBlocks: b.totalBlocks,
      lastError: b.lastError, lastOkAt: b.lastOkAt ? new Date(b.lastOkAt).toISOString() : null,
    }
  }
  return { open: anyOpen, hosts }
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
  const host = new URL(url).hostname
  const b = forHost(host)
  if (Date.now() < b.openUntil) {
    throw new BitsCircuitOpenError(`BITS circuit open for ${host} (${Math.ceil((b.openUntil - Date.now()) / 1000)}s left) — last: ${b.lastError}`)
  }
  return gate(async () => {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, init)
      if (res.status === 403 || res.status === 429) {
        b.consecutiveBlocks++
        b.totalBlocks++
        b.lastError = `HTTP ${res.status} ${new URL(url).pathname}`
        if (b.consecutiveBlocks >= BLOCK_TRIP) b.openUntil = Date.now() + COOLDOWN_MS
        return res // caller sees the status; the breaker now guards the next call
      }
      if (res.status >= 500 && attempt < MAX_RETRIES) { await sleep(backoff(attempt)); continue }
      if (res.status !== 401) { b.consecutiveBlocks = 0; b.lastOkAt = Date.now() } // 401 = session, not a block
      return res
    }
  })
}
