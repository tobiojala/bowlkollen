'use client'

import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { SEASON } from '@/lib/constants'
import { buildBrackets, type SmBracket } from '@/app/sm-slutspel/_components/bracket'
import type { TeamStanding } from '@/lib/division-standings'

// SM-slutspel, in its rightful place: a section on the Elitserien division page,
// scoped to that division's gender, driven by the selected season pill. A past
// season shows the champion + bracket; the current season shows the live
// prognosis (top 4 from the real table). Brand-themed (no old useColors page).
const SLUTSPEL_SEASON_ID = 2025 // the hardcoded bracket = 2025/26 (played May 2026)
const MIN_PLAYED = 3

function seasonLabel(id: number) { return `${String(id).slice(2)}/${String((id + 1) % 100).padStart(2, '0')}` }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2, padding: `${SPACE[6]}px ${SPACE[1]}px ${SPACE[3]}px` }}>{children}</div>
}

export function DivisionSlutspel({ gender, seasonYear, standings }: {
  gender: 'herrar' | 'damer'; seasonYear: number; standings: TeamStanding[]
}) {
  const currentYear = Number(SEASON.CURRENT.slice(0, 4))

  if (seasonYear === SLUTSPEL_SEASON_ID) {
    const { herrar, damer } = buildBrackets()
    const b = gender === 'herrar' ? herrar : damer
    return b.champion ? <Finished b={b} /> : null
  }
  if (seasonYear === currentYear) {
    return <Prognos standings={standings} seasonYear={seasonYear} />
  }
  return null
}

// ── Finished season — champion + compact bracket ──────────────────────────────
function Finished({ b }: { b: SmBracket }) {
  const sf = b.matches.filter(m => m.round === 'sf')
  const final = b.matches.find(m => m.round === 'final')
  const rows = [...sf, ...(final ? [final] : [])]
  return (
    <section>
      <SectionLabel>SM-SLUTSPEL · {seasonLabel(b.year - 1)}</SectionLabel>
      <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4] }}>
        <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3 }}>SVENSKA MÄSTARE</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: COLOR.gold, letterSpacing: '-0.01em', marginTop: 2 }}>{b.champion}</div>
        {b.story && <p style={{ fontSize: TYPE.body, color: COLOR.ink2, lineHeight: 1.6, marginTop: SPACE[2] }}>{b.story}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], marginTop: SPACE[4] }}>
          {rows.map(m => (
            <div key={m.id}>
              <div style={{ fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.06em', color: COLOR.ink3, marginBottom: 4 }}>{m.label.toUpperCase()}</div>
              <BracketLine name={m.home.team} seed={m.home.seed} won={m.home.isWinner} />
              <BracketLine name={m.away.team} seed={m.away.seed} won={m.away.isWinner} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: SPACE[4] }}>{b.venue} · {b.dates}</div>
      </div>
    </section>
  )
}

function BracketLine({ name, seed, won }: { name: string | null; seed: number | null; won: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], padding: '3px 0' }}>
      {seed != null && <span style={{ width: 18, fontSize: TYPE.caption, color: COLOR.ink3, fontVariantNumeric: 'tabular-nums' }}>{seed}</span>}
      <span style={{ flex: 1, fontSize: 16, fontWeight: won ? 700 : 600, color: won ? COLOR.ink : COLOR.ink2 }}>{name ?? '–'}</span>
      {won && <span style={{ fontSize: TYPE.caption, fontWeight: 700, color: COLOR.gold }}>vidare</span>}
    </div>
  )
}

// ── Current season — live prognosis (top 4 from the real table) ───────────────
function Prognos({ standings, seasonYear }: { standings: TeamStanding[]; seasonYear: number }) {
  const top4 = standings.slice(0, 4)
  const meaningful = top4.length === 4 && top4.every(t => t.played >= MIN_PLAYED)
  const rows = meaningful
    ? top4.map((t, i) => ({ seed: i + 1, name: t.teamName, sub: `${t.points} p · ${t.played} matcher` }))
    : [1, 2, 3, 4].map(n => ({ seed: n, name: 'Avgörs av grundserien', sub: null as string | null }))

  return (
    <section>
      <SectionLabel>SM-SLUTSPEL · {seasonLabel(seasonYear)} · PROGNOS</SectionLabel>
      <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4] }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: COLOR.ink, marginBottom: SPACE[3] }}>På väg till slutspel</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
          {rows.map(r => (
            <div key={r.seed} style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, background: r.seed === 1 ? COLOR.gold : COLOR.surface2, color: r.seed === 1 ? '#1a1400' : COLOR.ink,
              }}>{r.seed}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, color: meaningful ? COLOR.ink : COLOR.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              {r.sub && <span style={{ fontSize: TYPE.caption, color: COLOR.ink3, flexShrink: 0 }}>{r.sub}</span>}
              {meaningful && r.seed === 1 && <span style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.gold, flexShrink: 0 }}>väljer motståndare</span>}
            </div>
          ))}
        </div>
        <p style={{ fontSize: TYPE.caption, color: COLOR.ink3, lineHeight: 1.6, marginTop: SPACE[3] }}>
          Topp 4 går till slutspel. 1:an väljer motståndare (3:an eller 4:an), 2:an möter den kvarvarande. Prognos utifrån tabellen — inte officiell.
        </p>
      </div>
    </section>
  )
}
