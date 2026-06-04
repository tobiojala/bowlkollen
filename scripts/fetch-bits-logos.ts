#!/usr/bin/env npx tsx
/**
 * Populate bits_clubs.logo_url from the public BITS CDN.
 *
 * No cookie or login needed — logos are publicly accessible at:
 *   https://bits.swebowl.se/images/ClubLogo/[bits_id].png
 *
 * Run: npx tsx scripts/fetch-bits-logos.ts
 * Use --force to re-check clubs that already have a logo_url.
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
const SUPABASE_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY
const FORCE        = process.argv.includes('--force')
const LOGO_BASE    = 'https://bits.swebowl.se/images/ClubLogo'
const CONCURRENCY  = 10 // parallel HEAD requests

if (!SUPABASE_URL || !SUPABASE_SRK) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SRK)

async function hasLogo(bitsId: number): Promise<boolean> {
  try {
    const res = await fetch(`${LOGO_BASE}/${bitsId}.png`, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function main() {
  const query = supabase.from('bits_clubs').select('bits_id, name').order('name')
  if (!FORCE) query.is('logo_url', null)
  const { data: clubs, error } = await query
  if (error) { console.error('❌  Supabase error:', error.message); process.exit(1) }
  if (!clubs || clubs.length === 0) {
    console.log('✅  All clubs already have logos. Use --force to re-check.')
    return
  }

  console.log(`🖼️   Checking ${clubs.length} clubs for logos (${CONCURRENCY} at a time)...\n`)

  let found = 0, missing = 0

  // Process in batches of CONCURRENCY
  for (let i = 0; i < clubs.length; i += CONCURRENCY) {
    const batch = clubs.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async club => {
        const ok = await hasLogo(club.bits_id)
        return { club, ok }
      })
    )

    for (const { club, ok } of results) {
      process.stdout.write(`[${i + 1 + results.indexOf(results.find(r => r.club === club)!)}/${clubs.length}]  ${club.name.slice(0, 38).padEnd(38)}  `)
      if (ok) {
        const logoUrl = `${LOGO_BASE}/${club.bits_id}.png`
        const { error: updateErr } = await supabase
          .from('bits_clubs')
          .update({ logo_url: logoUrl })
          .eq('bits_id', club.bits_id)
        if (updateErr) {
          process.stdout.write(`✗ ${updateErr.message}\n`)
        } else {
          process.stdout.write(`✓ has logo\n`)
          found++
        }
      } else {
        process.stdout.write(`— no logo\n`)
        missing++
      }
    }
  }

  console.log(`\n🎉  Done — ${found} logos found and saved, ${missing} clubs have no logo on BITS`)
}

main()
