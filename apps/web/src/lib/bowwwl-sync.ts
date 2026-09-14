import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceSupabase } from '@/lib/supabase-server'
import { fetchBowwwlPage, bowwwlUrl } from '@/lib/bowwwl'

// Sync the bowwwl.com catalog into our bowling_balls table. Upserts on bowwwl_id so a
// re-sync preserves each row's uuid → player_balls (the arsenal) refs stay valid. The
// dataset is small (~a couple thousand), so we page through it fully each run; the
// per-page upsert keeps memory flat. Numbers arrive as strings ("2.590", "none").
const MAX_PAGES = 80

function toRow(b: Record<string, unknown>): Record<string, unknown> | null {
  const s = (k: string) => (b[k] == null || b[k] === '' ? null : String(b[k]))
  const n = (k: string) => { const v = Number(b[k]); return Number.isFinite(v) ? v : null }
  const id = s('ball_id')
  if (!id) return null
  const release = s('release_date')
  return {
    bowwwl_id:       id,
    brand:           s('brand_name') ?? 'Okänt',
    name:            s('ball_name') ?? 'Klot',
    coverstock:      s('coverstock_name'),
    coverstock_type: s('coverstock_type'),
    core:            s('core_name'),
    core_type:       s('core_type'),
    rg:              n('core_rg'),
    differential:    n('core_diff'),
    int_diff:        n('core_int_diff'),   // "none" → NaN → null
    factory_finish:  s('factory_finish'),
    image_url:       bowwwlUrl(s('ball_image')),
    thumbnail_url:   bowwwlUrl(s('thumbnail_image')),
    availability:    s('availability'),
    release_date:    release,
    release_year:    release ? (Number(release.slice(0, 4)) || null) : null,
    spec_weight:     n('core_weight'),
    source:          'bowwwl',
    synced_at:       new Date().toISOString(),
  }
}

export async function syncBowwwlBalls(): Promise<{ synced: number; pages: number; errors: string[] }> {
  const db = createServiceSupabase() as unknown as SupabaseClient
  const errors: string[] = []
  let synced = 0
  let page = 0
  for (; page < MAX_PAGES; page++) {
    const items = await fetchBowwwlPage(page)
    if (!items.length) break
    const rows = items.map(toRow).filter((r): r is Record<string, unknown> => r !== null)
    if (!rows.length) continue
    const { error } = await db.from('bowling_balls').upsert(rows, { onConflict: 'bowwwl_id' })
    if (error) errors.push(`page ${page}: ${error.message}`)
    else synced += rows.length
  }
  return { synced, pages: page, errors }
}
