'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { shortName } from '@/lib/utils'
import { groupByRound } from '@/lib/rounds'
import type { MatchRow } from '@/lib/division-standings'

const DAY_SE = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
const MON_SE = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
function dateTag(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  return `${DAY_SE[d.getDay()]} ${d.getDate()} ${MON_SE[d.getMonth()]}`
}

function hueOf(name: string) { return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360 }
function initialsOf(name: string) { return shortName(name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }

// ── One team's line: colour avatar + name (a doorway) + its score ─────────────
function TeamLine({ name, bitsId, score, win, finished, teamHref }: {
  name: string; bitsId: number | null; score: number | null; win: boolean; finished: boolean; teamHref: (id: number) => string
}) {
  const router = useRouter()
  const h = hueOf(name)
  const nameColor = !finished ? COLOR.ink : win ? COLOR.ink : COLOR.ink3
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: '2px 0' }}>
      <span style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: `hsla(${h},45%,45%,0.18)`, border: `1px solid hsla(${h},45%,55%,0.35)`,
        color: `hsl(${h},55%,72%)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800,
      }}>{initialsOf(name)}</span>

      <span
        onClick={bitsId != null ? (e => { e.preventDefault(); e.stopPropagation(); router.push(teamHref(bitsId)) }) : undefined}
        style={{
          flex: 1, minWidth: 0, fontSize: 16, fontWeight: win ? 700 : 600, color: nameColor,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          cursor: bitsId != null ? 'pointer' : 'default',
        }}
      >{shortName(name)}</span>

      {finished && (
        <span style={{
          flexShrink: 0, minWidth: 28, textAlign: 'right', fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums',
          fontSize: 22, fontWeight: 800, color: win ? COLOR.ink : COLOR.ink3,
        }}>{score}</span>
      )}
    </div>
  )
}

// ── One fixture — a clean stacked scoreboard: meta line, then a line per team ──
function Fixture({ m, teamHref }: { m: MatchRow; teamHref: (bitsId: number) => string }) {
  const done = !!(m.is_finished && m.home_result != null && m.away_result != null)
  const hw = done && m.home_result! > m.away_result!
  const aw = done && m.away_result! > m.home_result!
  const meta = [dateTag(m.match_date), !done ? m.hall_name : null].filter(Boolean).join('  ·  ')

  return (
    <Link href={`/matcher/${m.bits_match_id}`} style={{
      display: 'block', textDecoration: 'none', padding: `${SPACE[3]}px ${SPACE[4]}px`,
      borderTop: `1px solid ${COLOR.hairline}`, WebkitTapHighlightColor: 'transparent',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = `${COLOR.ink}05`)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ fontSize: 13, color: COLOR.ink3, marginBottom: SPACE[2], display: 'flex', alignItems: 'center', gap: 6 }}>
        {!done && <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR.gold }} />}
        {meta}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[1] }}>
        <TeamLine name={m.home_team_name} bitsId={m.home_bits_team_id} score={m.home_result} win={hw} finished={done} teamHref={teamHref} />
        <TeamLine name={m.away_team_name} bitsId={m.away_bits_team_id} score={m.away_result} win={aw} finished={done} teamHref={teamHref} />
      </div>
    </Link>
  )
}

function RoundBlock({ label, hint, gold, matches, teamHref }: {
  label: string; hint?: string; gold?: boolean; matches: MatchRow[]; teamHref: (bitsId: number) => string
}) {
  return (
    <section style={{ marginBottom: SPACE[2] }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: `${SPACE[6]}px ${SPACE[4]}px ${SPACE[2]}px` }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2 }}>{label.toUpperCase()}</span>
        {hint && <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: gold ? 700 : 500, color: gold ? COLOR.gold : COLOR.ink3 }}>{hint}</span>}
      </div>
      {matches.map(m => <Fixture key={m.bits_match_id} m={m} teamHref={teamHref} />)}
    </section>
  )
}

// Summary by default — next round + last round — with an inline "hela säsongen"
// expand (no sheet): the rest of the rounds unfold in place.
export function DivisionMatches({ matches, teamHref }: { matches: MatchRow[]; teamHref: (bitsId: number) => string }) {
  const [expanded, setExpanded] = useState(false)

  if (matches.length === 0) {
    return <div style={{ textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, padding: '64px 0' }}>Inga matcher synkade ännu</div>
  }

  const rounds   = groupByRound(matches)
  const upcoming = rounds.filter(r => !r.played)
  const played   = rounds.filter(r =>  r.played).reverse()
  const nextRound = upcoming[0]
  const lastRound = played[0]
  const hasMore = rounds.length > (nextRound ? 1 : 0) + (lastRound ? 1 : 0)

  if (expanded) {
    return (
      <div>
        {upcoming.map((g, i) => <RoundBlock key={g.key} label={g.label} hint={i === 0 ? 'spelas härnäst' : undefined} gold={i === 0} matches={g.matches} teamHref={teamHref} />)}
        {played.map(g => <RoundBlock key={g.key} label={g.label} matches={g.matches} teamHref={teamHref} />)}
        <ExpandButton label="Visa mindre" open onClick={() => setExpanded(false)} />
      </div>
    )
  }

  return (
    <div>
      {nextRound && <RoundBlock label="Nästa omgång" hint="spelas härnäst" gold matches={nextRound.matches} teamHref={teamHref} />}
      {lastRound && <RoundBlock label="Senaste omgången" matches={lastRound.matches} teamHref={teamHref} />}
      {hasMore && <ExpandButton label="Visa hela säsongen" onClick={() => setExpanded(true)} />}
    </div>
  )
}

function ExpandButton({ label, open, onClick }: { label: string; open?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
      margin: `${SPACE[3]}px 0`, padding: `${SPACE[3]}px`, borderRadius: 12,
      background: 'transparent', border: `1px solid ${COLOR.hairline}`, color: COLOR.ink2,
      fontSize: 14, fontWeight: 700, cursor: 'pointer',
    }}>
      {label}
      <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
    </button>
  )
}
