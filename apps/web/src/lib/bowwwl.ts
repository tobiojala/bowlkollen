import 'server-only'

// bowwwl.com ball-database API (Aaron granted access 2026-09-14 — sanctioned public
// API, attribution required; NOT scraping). We only read the v2 endpoint (paginated
// JSON, richest shape). Relative image paths are resolved against the base host.
export const BOWWWL_BASE = 'https://www.bowwwl.com'
export const BOWWWL_ATTRIBUTION = 'Data provided by bowwwl.com'

export function bowwwlUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return path.startsWith('http') ? path : `${BOWWWL_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

// One page of the v2 catalog (raw objects; the sync maps them). Returns [] past the
// last page so the caller can stop. Throws on a non-OK response so a failed run is loud.
export async function fetchBowwwlPage(page: number): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${BOWWWL_BASE}/restapi/balls/v2?page=${page}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`bowwwl v2 page ${page} → HTTP ${res.status}`)
  const json = await res.json()
  return Array.isArray(json) ? (json as Record<string, unknown>[]) : []
}

// The v1 endpoint (whole catalog in one response, not paginated) at a given weight —
// gives weight-specific core_rg/core_diff/core_int_diff. Used to build per-weight specs.
export async function fetchBowwwlV1(weight: number): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${BOWWWL_BASE}/restapi/balls?_format=json&weight=${weight}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`bowwwl v1 weight ${weight} → HTTP ${res.status}`)
  const json = await res.json()
  return Array.isArray(json) ? (json as Record<string, unknown>[]) : []
}
