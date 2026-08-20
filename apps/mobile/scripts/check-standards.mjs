#!/usr/bin/env node
// Standards ratchet for apps/mobile — the native twin of apps/web's ratchet, so a
// fresh session can't silently reintroduce banned patterns here either.
//
// A RATCHET, not a wall: existing debt is grandfathered in
// scripts/standards-baseline.json (path → count). It fails only when a file's
// violation count rises above baseline, or a *new* file violates. Debt only goes
// down. Native-relevant rules only (no <img>/<a href> — those are web).
//
//   node scripts/check-standards.mjs                    # check (runs on pretest)
//   node scripts/check-standards.mjs --update-baseline  # after intentional legacy work
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROOTS = ['app', 'components', 'lib']
const BASELINE_PATH = join(ROOT, 'scripts', 'standards-baseline.json')
const MAX_LINES = 300

const RULES = {
  'no-any': {
    desc: 'no `any` types (cast to a real type instead)',
    count: (t) => (t.match(/:\s*any\b|as any\b|<any>|Array<any>/g) ?? []).length,
  },
  'no-blue': {
    desc: 'no removed blue palette (use ink/green instead)',
    count: (t) => (t.match(/COLOR\.blue\b|blueMuted|#7ab4e8|#5a82b4/g) ?? []).length,
  },
  'max-lines': {
    desc: `files ≤ ${MAX_LINES} lines (extract components)`,
    count: (t) => { const n = t.split('\n').length; return n > MAX_LINES ? n : 0 },
  },
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = join(dir, name)
    const s = statSync(full)
    if (s.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

const files = ROOTS.flatMap((r) => { const d = join(ROOT, r); return existsSync(d) ? walk(d) : [] })
const found = {}
for (const key of Object.keys(RULES)) found[key] = {}
for (const file of files) {
  const rel = relative(ROOT, file)
  const text = readFileSync(file, 'utf8')
  for (const [key, rule] of Object.entries(RULES)) {
    const c = rule.count(text)
    if (c > 0) found[key][rel] = c
  }
}

if (process.argv.includes('--update-baseline')) {
  writeFileSync(BASELINE_PATH, JSON.stringify(found, null, 2) + '\n')
  console.log(`✓ baseline updated → ${relative(ROOT, BASELINE_PATH)}`)
  process.exit(0)
}

const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : {}
const regressions = []
for (const [key, hits] of Object.entries(found)) {
  const base = baseline[key] ?? {}
  for (const [rel, count] of Object.entries(hits)) {
    const allowed = base[rel] ?? 0
    if (count > allowed) regressions.push({ key, rel, count, allowed, desc: RULES[key].desc })
  }
}

if (regressions.length === 0) {
  console.log('✓ standards ratchet (native): no new violations')
  process.exit(0)
}

console.error('\n✗ standards ratchet (native): new violations (debt may only go DOWN)\n')
for (const r of regressions) {
  const detail = r.key === 'max-lines' ? `${r.count} lines (limit ${MAX_LINES})`
    : r.allowed === 0 ? `${r.count} new` : `${r.count} (was ${r.allowed})`
  console.error(`  [${r.key}] ${r.rel} — ${detail}\n      ${r.desc}`)
}
console.error('\nFix the file, or if this is intentional legacy work run:')
console.error('  npm run check:standards -- --update-baseline\n')
process.exit(1)
