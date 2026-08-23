'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { shortName } from '@/lib/utils'
import { groupByRound, roundDateLabel } from '@/lib/rounds'
import { matchKickoff } from '@bowlkollen/core'
import type { MatchRow } from '@/lib/division-standings'

const DAY_SE = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
const MON_SE = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
function dateTag(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  return `${DAY_SE[d.getDay()]} ${d.getDate()} ${MON_SE[d.getMonth()]}`
}

// One team's line: the name (a doorway to the team) sized to its text, a spacer
// that belongs to the match tap-target, then the banpoäng. Ink-first — winner
// ink, loser ink2 (WCAG-AA). No ink3/ink4 on meaningful text.
function TeamLine({ name, bitsId, score, win, finished, teamHref }: {
  name: string; bitsId: number | null; score: number | null; win: boolean; finished: boolean; teamHref: (id: number) => string
}) {
  const router = useRouter()
  const emph = !finished || win
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
      <span
        onClick={bitsId != null ? (e => { e.preventDefault(); e.stopPropagation(); router.push(teamHref(bitsId)) }) : undefined}
        style={{
          flex: '0 1 auto', minWidth: 0, fontSize: 18, fontWeight: emph ? 700 : 600,
          color: emph ? COLOR.ink : COLOR.ink2, letterSpacing: '-0.01em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          cursor: bitsId != null ? 'pointer' : 'default',
        }}
      >{shortName(name)}</span>
      <span style={{ flex: 1 }} />
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

// A fixture — a borderless row (hairline divider), meta line + a line per team,
// and a chevron. The whole row opens the match; the team names are inner doorways.
function Fixture({ m, teamHref }: { m: MatchRow; teamHref: (bitsId: number) => string }) {
  const done = !!(m.is_finished && m.home_result != null && m.away_result != null)
  const hw = done && m.home_result! > m.away_result!
  const aw = done && m.away_result! > m.home_result!
  const time = !done ? matchKickoff(m.match_datetime) : null
  const meta = [dateTag(m.match_date), time, !done ? m.hall_name : null].filter(Boolean).join('  ·  ')

  return (
    <Link href={`/matcher/${m.bits_match_id}`} style={{
      display: 'flex', alignItems: 'center', gap: SPACE[3], textDecoration: 'none',
      padding: `${SPACE[4]}px ${SPACE[1]}px`, borderTop: `1px solid ${COLOR.hairline}`, WebkitTapHighlightColor: 'transparent',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = `${COLOR.ink}05`)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink2, marginBottom: SPACE[3] }}>{meta}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
          <TeamLine name={m.home_team_name} bitsId={m.home_bits_team_id} score={m.home_result} win={hw} finished={done} teamHref={teamHref} />
          <TeamLine name={m.away_team_name} bitsId={m.away_bits_team_id} score={m.away_result} win={aw} finished={done} teamHref={teamHref} />
        </div>
      </div>
      <ChevronRight size={16} color={COLOR.ink4} style={{ flexShrink: 0 }} />
    </Link>
  )
}

function RoundBlock({ label, hint, gold, matches, teamHref }: {
  label: string; hint?: string; gold?: boolean; matches: MatchRow[]; teamHref: (bitsId: number) => string
}) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: `${SPACE[6]}px ${SPACE[1]}px ${SPACE[3]}px` }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2 }}>{label.toUpperCase()}</span>
        {hint && <span style={{ marginLeft: 'auto', fontSize: TYPE.caption, fontWeight: gold ? 700 : 500, color: gold ? COLOR.gold : COLOR.ink3 }}>{hint}</span>}
      </div>
      {matches.map(m => <Fixture key={m.bits_match_id} m={m} teamHref={teamHref} />)}
    </section>
  )
}

// Summary by default (next + last round); expand drops the full season inline in
// chronological order (Omgång 1 → last) so you scroll down through it — no sheet.
export function DivisionMatches({ matches, teamHref }: { matches: MatchRow[]; teamHref: (bitsId: number) => string }) {
  const [expanded, setExpanded] = useState(false)

  if (matches.length === 0) {
    return <div style={{ textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, padding: '64px 0' }}>Inga matcher synkade ännu</div>
  }

  const rounds   = groupByRound(matches)         // chronological, ascending
  const upcoming = rounds.filter(r => !r.played)
  const played   = rounds.filter(r =>  r.played)
  const nextRound = upcoming[0] ?? null
  const lastPlayed = played.length ? played[played.length - 1] : null
  const hasMore = rounds.length > (nextRound ? 1 : 0) + (lastPlayed ? 1 : 0)

  return (
    <div style={{ padding: `0 ${SPACE[4]}px` }}>
      {expanded ? (
        <>
          {rounds.map(g => (
            <RoundBlock
              key={g.key}
              label={g.label}
              hint={g === nextRound ? 'spelas härnäst' : roundDateLabel(g.firstDate, g.lastDate)}
              gold={g === nextRound}
              matches={g.matches}
              teamHref={teamHref}
            />
          ))}
          <ExpandButton label="Visa mindre" open onClick={() => setExpanded(false)} />
        </>
      ) : (
        <>
          {nextRound && <RoundBlock label="Nästa omgång" hint="spelas härnäst" gold matches={nextRound.matches} teamHref={teamHref} />}
          {lastPlayed && <RoundBlock label="Senaste omgången" hint={roundDateLabel(lastPlayed.firstDate, lastPlayed.lastDate)} matches={lastPlayed.matches} teamHref={teamHref} />}
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
