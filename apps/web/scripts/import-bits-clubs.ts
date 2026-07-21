#!/usr/bin/env npx tsx
/**
 * One-time BITS clubs import: all Swedish bowling clubs → Supabase bits_clubs table
 *
 * Setup:
 *   1. In Chrome DevTools on bits.swebowl.se, find the searchClubs request,
 *      Edit & resend with pageSize:500, copy the full JSON response.
 *   2. Save the JSON as scripts/bits-clubs.json
 *   3. Run the SQL migration below in the Supabase SQL editor
 *   4. npx tsx scripts/import-bits-clubs.ts
 *
 * SQL migration (run once in Supabase SQL editor):
 * ─────────────────────────────────────────────────
 *   create table if not exists bits_clubs (
 *     bits_id     integer primary key,
 *     name        text    not null,
 *     county      text,
 *     county_id   integer,
 *     hall_id     integer,
 *     hall_name   text,
 *     is_active   boolean default true,
 *     logo_url    text,
 *     is_play_bowl boolean default false,
 *     updated_at  timestamptz default now()
 *   );
 * ─────────────────────────────────────────────────
 *
 * Safe to re-run — upserts on bits_id.
 */

import * as fs   from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// ─── Load .env.local ─────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=')
    if (eq > 0 && !line.startsWith('#')) {
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  })
}

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SRK      = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SRK) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SRK)

// ─── Load JSON ───────────────────────────────────────────────────────────────
const jsonPath = path.join(process.cwd(), 'scripts', 'bits-clubs.json')
if (!fs.existsSync(jsonPath)) {
  console.error('❌  scripts/bits-clubs.json not found — paste the API response there first')
  process.exit(1)
}

const raw  = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const list = Array.isArray(raw) ? raw : (raw.data ?? [])

console.log(`📋  Loaded ${list.length} clubs from bits-clubs.json`)

// ─── Transform ───────────────────────────────────────────────────────────────
const rows = list.map((c: any) => ({
  bits_id:      c.clubId,
  name:         c.clubName,
  county:       c.county      ?? null,
  county_id:    c.clubCountyId ?? null,
  hall_id:      c.clubHallId  || null,
  hall_name:    c.hallName    || null,
  is_active:    c.clubIsActive ?? true,
  logo_url:     c.clubLogoUrl || null,
  is_play_bowl: c.clubIsPlayBowl ?? false,
  updated_at:   new Date().toISOString(),
}))

// ─── Upsert ──────────────────────────────────────────────────────────────────
async function main() {
  const CHUNK = 100
  let imported = 0

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await supabase
      .from('bits_clubs')
      .upsert(chunk, { onConflict: 'bits_id' })

    if (error) {
      console.error(`❌  Error on chunk ${i}–${i + CHUNK}:`, error.message)
      process.exit(1)
    }

    imported += chunk.length
    console.log(`   ✅  ${imported} / ${rows.length}`)
  }

  console.log(`\n🎉  Done — ${imported} clubs upserted into bits_clubs`)
}

main()
