#!/usr/bin/env npx tsx
/**
 * One-time SBHF import: bowling centers + pro shops → Supabase
 *
 * Setup:
 *   1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local  (from Supabase dashboard → Settings → API)
 *   2. Run the SQL migration in supabase/sbhf_tables.sql via the Supabase SQL editor
 *   3. npx tsx scripts/import-sbhf.ts
 *
 * Safe to re-run — uses upsert on the SBHF id.
 */

import * as fs from 'fs'
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
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌  Missing env vars. Add to .env.local:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL  (already there)')
  console.error('   SUPABASE_SERVICE_ROLE_KEY (Supabase dashboard → Settings → API → service_role)\n')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extract plain-text value of the <td> that follows a label <td> */
function field(html: string, label: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = html.match(new RegExp(`<td[^>]*>\\s*${esc}\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i'))
  if (!m) return ''
  // Strip the "(A=AMF, B=Brunswick)" tooltip that appears in machine type
  return stripHtml(m[1]).replace(/\(A=AMF,\s*B=Brunswick\)/g, '').trim()
}

/** Extract href from the link inside the value <td> (skips mailto:) */
function fieldHref(html: string, label: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = html.match(new RegExp(`<td[^>]*>\\s*${esc}\\s*<\\/td>\\s*<td[^>]*>[\\s\\S]*?href="([^"]*)"`, 'i'))
  if (!m || m[1].startsWith('mailto:')) return ''
  return m[1]
}

/** Extract the email address from a mailto: link inside the value <td> */
function fieldEmail(html: string, label: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = html.match(new RegExp(`<td[^>]*>\\s*${esc}\\s*<\\/td>\\s*<td[^>]*>[\\s\\S]*?href="mailto:([^"]*)"`, 'i'))
  return m ? m[1].trim() : ''
}

/** Parse an address <td> into street / postalCode / city */
function parseAddr(addrHtml: string) {
  const cleaned = addrHtml.replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '')
  const lines = cleaned
    .split(/<br\s*\/?>/i)
    .map(l => stripHtml(l))
    .filter(l => l.length > 0)

  const street = lines[0] ?? ''
  const postalLine = lines[1] ?? ''
  const m = postalLine.match(/^(\d{3}\s?\d{2})\s+(.+)$/)
  return {
    street,
    postalCode: m ? m[1].replace(/\s/, '') : '',
    city: m ? m[2].trim() : postalLine.trim(),
  }
}

/** Grab the raw <td> content for an address label and parse it */
function addrBlock(html: string, label: string) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = html.match(new RegExp(`<td[^>]*>\\s*${esc}\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i'))
  return m ? parseAddr(m[1]) : { street: '', postalCode: '', city: '' }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function get(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Bowlkollen/1.0 (data import; tobias.bergmark@gmail.com)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// ─── ID extraction ────────────────────────────────────────────────────────────

function hallIds(html: string): number[] {
  const ids = new Set<number>()
  for (const m of html.matchAll(/href="main\.php\?action=showHall&(?:amp;)?id=(\d+)"/g))
    ids.add(parseInt(m[1]))
  return [...ids]
}

function shopIds(html: string): number[] {
  const ids = new Set<number>()
  for (const m of html.matchAll(/href="main\.php\?action=showBallShop&(?:amp;)?id=(\d+)"/g))
    ids.add(parseInt(m[1]))
  return [...ids]
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseHall(id: number, html: string) {
  const nameM = html.match(/<h1>([^<(]+)/)
  const name  = nameM ? nameM[1].trim() : `Hall ${id}`
  const addr  = addrBlock(html, 'Besöksadress:')

  // Online scoring/booking — links contain an SVG then the label text
  const scoringM = html.match(/<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?Online Scoring/i)
  const bookingM = html.match(/<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?Online-bokning/i)

  const lanesRaw = field(html, 'Antal banor:')
  const inspRaw  = field(html, 'Besikningsdatum:')

  return {
    id,
    name,
    city:                addr.city         || null,
    street_address:      addr.street       || null,
    postal_code:         addr.postalCode   || null,
    phone:               field(html, 'Telefon:')        || null,
    email:               fieldEmail(html, 'E-post:')    || null,
    website:             fieldHref(html, 'Hemsida:')    || null,
    region:              field(html, 'Region:')         || null,
    lanes:               lanesRaw ? parseInt(lanesRaw)  : null,
    machine_type:        field(html, 'Maskintyp:')      || null,
    lane_type:           field(html, 'Bantyp:')         || null,
    oil_machine:         field(html, 'Oljemaskinstyp:') || null,
    online_scoring:      !!scoringM,
    online_scoring_url:  scoringM ? scoringM[1] : null,
    online_booking:      !!bookingM,
    online_booking_url:  bookingM ? bookingM[1] : null,
    accepts_gift_cards:  field(html, 'Tar emot elektroniska presentkort:').toLowerCase() === 'ja',
    inspection_status:   field(html, 'Besikningsstatus:') || null,
    inspection_date:     inspRaw || null,
    updated_at:          new Date().toISOString(),
  }
}

function parseShop(id: number, html: string) {
  const nameM = html.match(/<h1>([^<]+)/)
  const rawName = nameM ? nameM[1].trim() : `Shop ${id}`
  const name = rawName.replace(/\s*\(IBPSIA certifierad\)/gi, '').trim()
  const addr = addrBlock(html, 'Adress:')

  return {
    id,
    name,
    city:              addr.city       || null,
    street_address:    addr.street     || null,
    postal_code:       addr.postalCode || null,
    phone:             field(html, 'Telefon:')     || null,
    mobile:            field(html, 'Mobil:')       || null,
    email:             fieldEmail(html, 'E-post:') || null,
    website:           fieldHref(html, 'Hemsida:') || null,
    ibpsia_certified:  /IBPSIA/i.test(rawName) || /IBPSIA certifi/i.test(html),
    accepts_gift_cards: /Tar emot[\s\S]{0,60}presentkort[\s\S]{0,80}<td[^>]*>\s*Ja/i.test(html),
    updated_at:        new Date().toISOString(),
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎳  SBHF Import\n')

  // ── Bowling halls ────────────────────────────────────────────────────────
  console.log('Fetching hall listing...')
  const hallList = await get('https://www.sbhf.se/bowlinghallar/hallar')
  const ids      = hallIds(hallList)
  console.log(`Found ${ids.length} halls\n`)

  const halls: ReturnType<typeof parseHall>[] = []
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    process.stdout.write(`  [${String(i + 1).padStart(3)}/${ids.length}] id=${id} `)
    try {
      const html = await get(`https://www.sbhf.se/bowlinghallar/hallar?action=showHall&id=${id}`)
      const hall = parseHall(id, html)
      halls.push(hall)
      process.stdout.write(`${hall.name}\n`)
    } catch (e: any) {
      process.stdout.write(`ERROR: ${e.message}\n`)
    }
    await sleep(150)
  }

  console.log(`\nUpserting ${halls.length} bowling centers...`)
  const { error: he } = await db.from('bowling_centers').upsert(halls, { onConflict: 'id' })
  if (he) console.error('  ❌', he.message)
  else    console.log('  ✓ done')

  // ── Pro shops ────────────────────────────────────────────────────────────
  console.log('\nFetching pro shop listing...')
  const shopList = await get('https://www.sbhf.se/klotshopar')
  const sids     = shopIds(shopList)
  console.log(`Found ${sids.length} shops\n`)

  const shops: ReturnType<typeof parseShop>[] = []
  for (let i = 0; i < sids.length; i++) {
    const id = sids[i]
    process.stdout.write(`  [${String(i + 1).padStart(2)}/${sids.length}] id=${id} `)
    try {
      const html = await get(`https://www.sbhf.se/klotshopar?action=showBallShop&id=${id}`)
      const shop = parseShop(id, html)
      shops.push(shop)
      process.stdout.write(`${shop.name}\n`)
    } catch (e: any) {
      process.stdout.write(`ERROR: ${e.message}\n`)
    }
    await sleep(150)
  }

  console.log(`\nUpserting ${shops.length} pro shops...`)
  const { error: se } = await db.from('pro_shops').upsert(shops, { onConflict: 'id' })
  if (se) console.error('  ❌', se.message)
  else    console.log('  ✓ done')

  console.log('\n🏁  Import complete!\n')
}

main().catch(e => { console.error('\n❌', e); process.exit(1) })
