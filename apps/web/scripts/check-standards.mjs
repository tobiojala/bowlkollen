#!/usr/bin/env node
// Standards ratchet for apps/web. Enforces the AGENTS.md engineering rules that
// can be checked mechanically, so a fresh session can't silently reintroduce them.
//
// It is a RATCHET, not a wall: existing debt is grandfathered in
// scripts/standards-baseline.json (path → count). The build fails only when a
// file's violation count rises above its baseline, or a *new* file violates.
// Debt can only go down. Lower a count and the baseline auto-tightens next
// --update-baseline; you can never go back up without an explicit baseline bump.
//
//   node scripts/check-standards.mjs                 # check (used by prebuild)
//   node scripts/check-standards.mjs --update-baseline  # after intentional legacy work
//
// Rules (see AGENTS.md): no `any`, no removed-blue palette, no <img>/<a href>
// for internal routes, files ≤ 300 lines.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const BASELINE_PATH = join(ROOT, 'scripts', 'standards-baseline.json')
const MAX_LINES = 300

// Each rule: how to count violations in one file. Count is a number; the ratchet
// compares it against the baseline for that path.
const RULES = {
  'no-any': {
    desc: 'no `any` types (AGENTS.md: import from types.ts, cast instead)',
    count: (text) => (text.match(/:\s*any\b|as any\b|<any>|Array<any>/g) ?? []).length,
    applies: (p) => p.endsWith('.ts') || p.endsWith('.tsx'),
  },
  'no-blue': {
    desc: 'no removed blue palette (AGENTS.md: use ink/green instead)',
    count: (text) => (text.match(/COLOR\.blue\b|blueMuted|#7ab4e8|#5a82b4/g) ?? []).length,
    applies: (p) => p.endsWith('.ts') || p.endsWith('.tsx'),
  },
  'no-img': {
    desc: 'no raw <img> (AGENTS.md: use next/image)',
    count: (text) => (text.match(/<img\s/g) ?? []).length,
    applies: (p) => p.endsWith('.tsx'),
  },
  'no-a-href-internal': {
    desc: 'no <a href="/…"> for internal routes (AGENTS.md: use next/link)',
    count: (text) => (text.match(/<a\s+[^>]*href=["']\/[a-z]/g) ?? []).length,
    applies: (p) => p.endsWith('.tsx'),
  },
  'max-lines': {
    desc: `files ≤ ${MAX_LINES} lines (AGENTS.md: extract into _components/)`,
    count: (text) => { const n = text.split('\n').length; return n > MAX_LINES ? n : 0 },
    applies: (p) => p.endsWith('.ts') || p.endsWith('.tsx'),
  },
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue
    const full = join(dir, name)
    const s = statSync(full)
    if (s.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

function scan() {
  const found = {} // rule → { relpath → count }
  for (const key of Object.keys(RULES)) found[key] = {}
  for (const file of walk(SRC)) {
    const rel = relative(ROOT, file)
    const text = readFileSync(file, 'utf8')
    for (const [key, rule] of Object.entries(RULES)) {
      if (!rule.applies(rel)) continue
      const c = rule.count(text)
      if (c > 0) found[key][rel] = c
    }
  }
  return found
}

const found = scan()

if (process.argv.includes('--update-baseline')) {
  writeFileSync(BASELINE_PATH, JSON.stringify(found, null, 2) + '\n')
  console.log(`✓ baseline updated → ${relative(ROOT, BASELINE_PATH)}`)
  process.exit(0)
}

const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : {}
const regressions = []
for (const [key, files] of Object.entries(found)) {
  const base = baseline[key] ?? {}
  for (const [rel, count] of Object.entries(files)) {
    const allowed = base[rel] ?? 0
    if (count > allowed) regressions.push({ key, rel, count, allowed, desc: RULES[key].desc })
  }
}

if (regressions.length === 0) {
  console.log('✓ standards ratchet: no new violations')
  process.exit(0)
}

console.error('\n✗ standards ratchet: new violations (debt may only go DOWN)\n')
for (const r of regressions) {
  const detail = r.key === 'max-lines' ? `${r.count} lines (limit ${MAX_LINES})`
    : r.allowed === 0 ? `${r.count} new` : `${r.count} (was ${r.allowed})`
  console.error(`  [${r.key}] ${r.rel} — ${detail}`)
  console.error(`      ${r.desc}`)
}
console.error('\nFix the file, or if this is intentional legacy work run:')
console.error('  npm run check:standards -- --update-baseline\n')
process.exit(1)
