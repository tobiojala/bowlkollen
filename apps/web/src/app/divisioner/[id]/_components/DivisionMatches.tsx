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
// One team's line: the name (a doorway) and its banpoäng. Ink-first — winner in
// ink, loser in ink2 (WCAG-AA), per BRAND "names/scores are all ink". No avatars
// in list rows (kept clean), no ink3/ink4 on meaningful text, no borders.
function TeamLine({ name, bitsId, score, win, finished, teamHref }: {
  name: string; bitsId: number | null; score: number | null; win: boolean; finished: boolean; teamHref: (id: number) => string
}) {
  const router = useRouter()
  const emph = !finished || win // upcoming: both full ink; finished: winner full, loser ink2
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
      <span
        onClick={bitsId != null ? (e => { e.preventDefault(); e.stopPropagation(); router.push(teamHref(bitsId)) }) : undefined}
        style={{
          flex: 1, minWidth: 0, fontSize: 18, fontWeight: emph ? 700 : 600,
          color: emph ? COLOR.ink : COLOR.ink2, letterSpacing: '-0.01em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          cursor: bitsId != null ? 'pointer' : 'default',
        }}
      >{shortName(name)}</span>

      {finished && (
        <span style={{
          flexShrink: 0, minWidth: 26, textAlign: 'right', fontFamily: FONT.score,
          fontVariantNumeric: 'tabular-nums', fontSize: 24, fontWeight: 800,
          color: win ? COLOR.ink : COLOR.ink2,
        }}>{score}</span>
      )}
    </div>
  )
}

// A fixture — a tonal surface card (no border), a clean meta line, then a line
// per team. The card is the tap target (→ match); team names are inner doorways.
function Fixture({ m, teamHref }: { m: MatchRow; teamHref: (bitsId: number) => string }) {
  const done = !!(m.is_finished && m.home_result != null && m.away_result != null)
  const hw = done && m.home_result! > m.away_result!
  const aw = done && m.away_result! > m.home_result!
  const meta = [dateTag(m.match_date), !done ? m.hall_name : null].filter(Boolean).join('  ·  ')

  return (
    <Link href={`/matcher/${m.bits_match_id}`} style={{
      display: 'block', textDecoration: 'none', padding: `${SPACE[4]}px ${SPACE[1]}px`,
      borderTop: `1px solid ${COLOR.hairline}`, WebkitTapHighlightColor: 'transparent',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = `${COLOR.ink}05`)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ fontSize: TYPE.caption, color: COLOR.ink2, marginBottom: SPACE[3] }}>{meta}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
        <TeamLine name={m.home_team_name} bitsId={m.home_bits_team_id} score={m.home_result} win={hw} finished={done} teamHref={teamHref} />
        <TeamLine name={m.away_team_name} bitsId={m.away_bits_team_id} score={m.away_result} win={aw} finished={done} teamHref={teamHref} />
      </div>
    </Link>
  )
}

function RoundBlock({ label, hint, matches, teamHref }: {
  label: string; hint?: string; matches: MatchRow[]; teamHref: (bitsId: number) => string
}) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: `${SPACE[6]}px ${SPACE[1]}px ${SPACE[3]}px` }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2 }}>{label.toUpperCase()}</span>
        {hint && <span style={{ marginLeft: 'auto', fontSize: TYPE.caption, fontWeight: 700, color: COLOR.gold }}>{hint}</span>}
      </div>
      {matches.map(m => <Fixture key={m.bits_match_id} m={m} teamHref={teamHref} />)}
    </section>
  )
}

// Summary by default (next + last round), inline "hela säsongen" expand — no sheet.
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

  return (
    <div style={{ padding: `0 ${SPACE[4]}px` }}>
      {expanded ? (
        <>
          {upcoming.map((g, i) => <RoundBlock key={g.key} label={g.label} hint={i === 0 ? 'spelas härnäst' : undefined} matches={g.matches} teamHref={teamHref} />)}
          {played.map(g => <RoundBlock key={g.key} label={g.label} matches={g.matches} teamHref={teamHref} />)}
          <ExpandButton label="Visa mindre" open onClick={() => setExpanded(false)} />
        </>
      ) : (
        <>
          {nextRound && <RoundBlock label="Nästa omgång" hint="spelas härnäst" matches={nextRound.matches} teamHref={teamHref} />}
          {lastRound && <RoundBlock label="Senaste omgången" matches={lastRound.matches} teamHref={teamHref} />}
          {hasMore && <ExpandButton label="Visa hela säsongen" onClick={() => setExpanded(true)} />}
        </>
      )}
    </div>
  )
}

function ExpandButton({ label, open, onClick }: { label: string; open?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
      marginTop: SPACE[4], padding: SPACE[3], borderRadius: 12,
      background: COLOR.surface, border: 'none', color: COLOR.ink2, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    }}>
      {label}
      <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
    </button>
  )
}
