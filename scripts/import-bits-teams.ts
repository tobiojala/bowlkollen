#!/usr/bin/env npx tsx
/**
 * Import all active BITS teams for every club → Supabase bits_teams table
 *
 * Setup:
 *   1. Run the SQL migration in Supabase SQL editor (see bottom of this file)
 *   2. Get a fresh session cookie from bits.swebowl.se DevTools:
 *      - Open DevTools → Network → Fetch/XHR → any request to api.swebowl.se
 *      - Copy the full "cookie" request header value
 *   3. BITS_COOKIE="<paste>" npx tsx scripts/import-bits-teams.ts
 *
 * Safe to re-run — upserts on bits_team_id.
 *
 * SQL migration:
 * ──────────────────────────────────────────────────────────────
 *   create table if not exists bits_teams (
 *     bits_team_id  integer primary key,
 *     bits_club_id  integer references bits_clubs(bits_id),
 *     name          text not null,
 *     club_name     text,
 *     hall_id       integer,
 *     hall_name     text,
 *     team_type     integer,
 *     team_type_desc text,
 *     team_alias    text,
 *     updated_at    timestamptz default now()
 *   );
 *   alter table bits_teams enable row level security;
 *   create policy "public read bits_teams" on bits_teams for select using (true);
 * ──────────────────────────────────────────────────────────────
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
const BITS_COOKIE  = process.env.BITS_COOKIE
const API_KEY      = '62fcl8gPUMXSQGW1t2Y8mc2zeTk97vbd'

if (!SUPABASE_URL || !SUPABASE_SRK) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
if (!BITS_COOKIE) {
  console.error('❌  Missing BITS_COOKIE env var')
  console.error('   Get it from DevTools → any api.swebowl.se request → copy the "cookie" header')
  console.error('   Then run: BITS_COOKIE="<paste>" npx tsx scripts/import-bits-teams.ts')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SRK)

// ─── Load club list ───────────────────────────────────────────────────────────
const jsonPath = path.join(process.cwd(), 'scripts', 'bits-clubs.json')
const raw  = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const clubs: { clubId: number; clubName: string }[] = Array.isArray(raw) ? raw : (raw.data ?? [])
console.log(`📋  ${clubs.length} clubs to process\n`)

// ─── Fetch teams for one club ─────────────────────────────────────────────────
async function fetchTeams(clubId: number): Promise<any[]> {
  const res = await fetch(
    `https://api.swebowl.se/api/v1/team/GetAllActiveTeams?apiKey=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'content-type': 'application/json',
        'origin': 'https://bits.swebowl.se',
        'referer': 'https://bits.swebowl.se/',
        'cookie': BITS_COOKIE!,
      },
      body: JSON.stringify({
        ClubId: clubId, take: 200, skip: 0, page: 1, pageSize: 200,
        sort: [{ field: 'teamName', dir: 'asc' }],
      }),
    }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status} for clubId=${clubId}`)
  const data = await res.json()
  return data.data ?? []
}

// ─── Main loop ────────────────────────────────────────────────────────────────
async function main() {
  let totalTeams = 0
  let totalClubs = 0
  const allRows: any[] = []

  for (let i = 0; i < clubs.length; i++) {
    const club = clubs[i]
    try {
      const teams = await fetchTeams(club.clubId)
      if (teams.length === 0) continue

      const rows = teams.map(t => ({
        bits_team_id:  t.teamId,
        bits_club_id:  club.clubId,
        name:          t.teamName,
        club_name:     t.clubName ?? null,
        hall_id:       t.teamHallId || null,
        hall_name:     t.hallName   || null,
        team_type:     t.teamType   ?? null,
        team_type_desc: t.teamTypeDescription ?? null,
        team_alias:    t.teamAlias  || null,
        updated_at:    new Date().toISOString(),
      }))

      allRows.push(...rows)
      totalTeams += teams.length
      totalClubs++

      process.stdout.write(`\r   ${i + 1}/${clubs.length} klubbar — ${totalTeams} lag`)

      // Small delay to avoid hammering the API
      if (i % 10 === 9) await new Promise(r => setTimeout(r, 300))
    } catch (err: any) {
      console.error(`\n⚠️  clubId=${club.clubId} (${club.clubName}): ${err.message}`)
    }
  }

  // Deduplicate by bits_team_id (some teams appear under multiple clubs)
  const seen = new Set<number>()
  const unique = allRows.filter(r => {
    if (seen.has(r.bits_team_id)) return false
    seen.add(r.bits_team_id)
    return true
  })

  console.log(`\n\n📦  Upserting ${unique.length} unique teams in batches…`)
  const allRows2 = unique

  const CHUNK = 200
  for (let i = 0; i < allRows2.length; i += CHUNK) {
    const chunk = allRows2.slice(i, i + CHUNK)
    const { error } = await supabase.from('bits_teams').upsert(chunk, { onConflict: 'bits_team_id' })
    if (error) {
      console.error(`❌  Upsert error on chunk ${i}:`, error.message)
      process.exit(1)
    }
    process.stdout.write(`\r   ✅  ${Math.min(i + CHUNK, allRows2.length)} / ${allRows2.length}`)
  }

  console.log(`\n\n🎉  Done — ${totalTeams} teams from ${totalClubs} clubs upserted into bits_teams`)
}

main()
