#!/usr/bin/env npx tsx
/**
 * Seed oil profiles from swebowl.se into Supabase.
 * Source: https://www.swebowl.se/vaar-verksamhet/foerbundet/foerbundsinfo/regelverk/oljeprofiler/
 *
 * Run: npx tsx scripts/seed-oil-profiles.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) in .env.local
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
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

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const BASE = 'https://www.swebowl.se'

const profiles = [
  // ── EA — Elitserien Herrar + Allsvenskan Herrar + Elitserien Damer ────────
  {
    name: 'EA 36 2025', length_ft: 36, ratio: 2.65,
    category: 'elite', season: '2025/2026',
    description: 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer',
    pdf_url:  BASE + '/media/avdh4mpg/ea-36-2025.pdf',
  },
  {
    name: 'EA 38 B 2025', length_ft: 38, ratio: 3.65,
    category: 'elite', season: '2025/2026',
    description: 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer',
    pdf_url:  BASE + '/media/noac5zww/ea38-2025_b.pdf',
  },
  {
    name: 'EA 40 2025', length_ft: 40, ratio: 3.03,
    category: 'elite', season: '2025/2026',
    description: 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer',
    pdf_url:  BASE + '/media/lfxhmf4r/ea40-2025.pdf',
  },
  {
    name: 'EA 42 2025', length_ft: 42, ratio: 3.00,
    category: 'elite', season: '2025/2026',
    description: 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer',
    pdf_url:  BASE + '/media/ackm14au/ea42-2025.pdf',
  },
  {
    name: 'EA 44 2025', length_ft: 44, ratio: 2.88,
    category: 'elite', season: '2025/2026',
    description: 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer',
    pdf_url:  BASE + '/media/033hdhcs/ea44-2025.pdf',
  },
  {
    name: 'EA 46 2025', length_ft: 46, ratio: 3.00,
    category: 'elite', season: '2025/2026',
    description: 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer',
    pdf_url:  BASE + '/media/de5lwy0w/ea46-2025.pdf',
  },

  // ── DE — Elitserien Damer extra ───────────────────────────────────────────
  {
    name: 'DE 39 2025', length_ft: 39, ratio: 3.85,
    category: 'elite_damer', season: '2025/2026',
    description: 'Elitserien Damer (extra)',
    pdf_url:  BASE + '/media/eakngimc/de39-2025.pdf',
  },
  {
    name: 'DE 44 2025', length_ft: 44, ratio: 3.24,
    category: 'elite_damer', season: '2025/2026',
    description: 'Elitserien Damer (extra)',
    pdf_url:  BASE + '/media/sb5efu3d/de44-2025.pdf',
  },

  // ── BDA — Allsvenskan Damer + Division 1–3 ────────────────────────────────
  {
    name: 'BDA 38 2025', length_ft: 38, ratio: 4.04,
    category: 'bredare', season: '2025/2026',
    description: 'Allsvenskan Damer, Division 1–3',
  },
  {
    name: 'BDA 39 2024', length_ft: 39, ratio: 4.32,
    category: 'bredare', season: '2025/2026',
    description: 'Allsvenskan Damer, Division 1–3',
  },
  {
    name: 'BDA 40 2025', length_ft: 40, ratio: 5.23,
    category: 'bredare', season: '2025/2026',
    description: 'Allsvenskan Damer, Division 1–3',
  },
  {
    name: 'BDA 41 2023', length_ft: 41, ratio: 5.59,
    category: 'bredare', season: '2025/2026',
    description: 'Allsvenskan Damer, Division 1–3',
  },
  {
    name: 'BDA 42 2025', length_ft: 42, ratio: 4.40,
    category: 'bredare', season: '2025/2026',
    description: 'Allsvenskan Damer, Division 1–3',
  },

  // ── Sammandrag (compilation events) ──────────────────────────────────────
  {
    name: 'Sammandrag 38 2025-27', length_ft: 38, ratio: 5.50,
    category: 'sammandrag', season: '2025/2027',
    description: 'Sammandrag',
  },
  {
    name: 'Sammandrag 39 2025-27', length_ft: 39, ratio: 3.57,
    category: 'sammandrag', season: '2025/2027',
    description: 'Sammandrag',
  },
  {
    name: 'Sammandrag 40 2025-27', length_ft: 40, ratio: 3.89,
    category: 'sammandrag', season: '2025/2027',
    description: 'Sammandrag',
  },
  {
    name: 'Sammandrag 41 2025-27', length_ft: 41, ratio: 5.24,
    category: 'sammandrag', season: '2025/2027',
    description: 'Sammandrag',
  },
  {
    name: 'Sammandrag 42 2025-27', length_ft: 42, ratio: 4.60,
    category: 'sammandrag', season: '2025/2027',
    description: 'Sammandrag',
  },
  {
    name: 'Sammandrag 43 DE 2026', length_ft: 43, ratio: 3.67,
    category: 'sammandrag', season: '2025/2026',
    description: 'Sammandrag Damer',
  },
  {
    name: 'Sammandrag Elitserien Herrar 2026', length_ft: 43, ratio: 2.95,
    category: 'sammandrag', season: '2025/2026',
    description: 'Sammandrag Elitserien Herrar',
  },

  // ── Kvalprofiler 2026 ─────────────────────────────────────────────────────
  {
    name: 'Kval Allsvenskan–Div 2 2026', length_ft: 40, ratio: 3.45,
    category: 'kval', season: '2026',
    description: 'Kval till Allsvenskan och Division 2',
    pdf_url:  BASE + '/media/fe0nflzv/40_kval_div_13_2026.pdf',
  },
  {
    name: 'Kval Elitserien Dam och Herr 2026', length_ft: 37, ratio: 2.07,
    category: 'kval', season: '2026',
    description: 'Kval till Elitserien Dam och Herr',
    pdf_url:  BASE + '/media/pfsacjho/37_kval_elit_2026.pdf',
  },
  {
    name: 'Elitserien Slutspelskval Herrar 2026', length_ft: 40, ratio: 2.80,
    category: 'kval', season: '2026',
    description: 'Elitserien Slutspelskval Herrar',
    pdf_url:  BASE + '/media/bbonrybe/elitserien-slutspelskval-2026.pdf',
  },

  // ── SM Slutspel 2026 ───────────────────────────────────────────────────────
  {
    name: 'Dam SM Slutspel 2026 – Glendert', length_ft: 39, ratio: 2.64,
    category: 'sm', season: '2026',
    description: 'Dam SM Slutspel 2026',
    pdf_url:  BASE + '/media/qchljn5l/dam-sm-slutspel-2026-glendert-39.pdf',
    kosi_url: BASE + '/media/l3onkczn/dam-sm-slutspel-2026-glendert-39.txt',
  },
  {
    name: 'Dam SM Slutspel 2026 – Flack', length_ft: 44, ratio: 2.76,
    category: 'sm', season: '2026',
    description: 'Dam SM Slutspel 2026',
    pdf_url:  BASE + '/media/lvfbvv3p/dam-sm-slutspel-2026-flack-44.pdf',
    kosi_url: BASE + '/media/w13p2kaj/dam-sm-slutspel-2026-flack-44.txt',
  },
  {
    name: 'Herr SM Slutspel 2026 – Linus', length_ft: 39, ratio: 1.75,
    category: 'sm', season: '2026',
    description: 'Herr SM Slutspel 2026',
    pdf_url:  BASE + '/media/tidlpjjx/herr-sm-slutspel-2026-linus-39.pdf',
    kosi_url: BASE + '/media/xhedp0kb/herr-sm-slutspel-2026-linus-39.txt',
  },
  {
    name: 'Herr SM Slutspel 2026 – Backe', length_ft: 43, ratio: 1.46,
    category: 'sm', season: '2026',
    description: 'Herr SM Slutspel 2026',
    pdf_url:  BASE + '/media/ytwdp1li/herr-sm-slutspel-2026-backe-43.pdf',
    kosi_url: BASE + '/media/xh3b25jj/herr-sm-slutspel-2026-backe-43.txt',
  },
]

async function main() {
  console.log('\n🛢️  Oil profiles seed\n')

  // Clear existing and re-insert so we can re-run safely
  const { error: delErr } = await db.from('oil_profiles').delete().neq('id', 0)
  if (delErr) { console.error('❌  Delete failed:', delErr.message); process.exit(1) }

  const { error } = await db.from('oil_profiles').insert(profiles)
  if (error) { console.error('❌  Insert failed:', error.message); process.exit(1) }

  console.log(`✓  Inserted ${profiles.length} profiles`)
  console.log('\n🏁  Done!\n')
}

main().catch(e => { console.error('\n❌', e); process.exit(1) })
