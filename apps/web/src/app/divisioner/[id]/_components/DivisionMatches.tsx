'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { COLOR, FONT, TYPE } from '@/lib/brand'
import { shortName } from '@/lib/utils'
import { groupByRound, roundDateLabel, type RoundGroup } from '@/lib/rounds'
import type { MatchRow } from '@/lib/division-standings'

const DAY_SE = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
function dayTag(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  return `${DAY_SE[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

// ── One fixture — the two teams face off across a centre (score / vs), so it
//    reads as a match. Team names are doorways; where they lead is decided by
//    the host (division → lens, team page → opponent's team page).
function Fixture({ m, teamHref }: { m: MatchRow; teamHref: (bitsId: number) => string }) {
  const router = useRouter()
  const done = !!(m.is_finished && m.home_result != null && m.away_result != null)
  const hw   = done && m.home_result! > m.away_result!
  const aw   = done && m.away_result! > m.home_result!

  const teamName = (
    text: string, bitsId: number | null, win: boolean, align: React.CSSProperties['textAlign'],
  ) => (
    <span
      onClick={bitsId != null
        ? (e => { e.preventDefault(); e.stopPropagation(); router.push(teamHref(bitsId)) })
        : undefined}
      style={{
        display: 'block', textAlign: align,
        fontSize: 16, lineHeight: 1.3,
        // Loser stays legible (ink2 ≈ 7:1), just dimmer than the winner.
        fontWeight: done ? (win ? 700 : 600) : 600,
        color: done ? (win ? COLOR.ink : COLOR.ink2) : COLOR.ink,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        cursor: bitsId != null ? 'pointer' : 'default', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {shortName(text)}
    </span>
  )

  const scoreCell = (val: number | null, win: boolean) => (
    <span style={{ fontSize: 24, fontWeight: 900, color: win ? COLOR.ink : COLOR.ink2 }}>{val}</span>
  )

  return (
    <Link
      href={`/matcher/${m.bits_match_id}`}
      style={{
        display: 'block', textDecoration: 'none',
        padding: '16px 20px', borderTop: `1px solid ${COLOR.hairline}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Meta — venue (upcoming) left, match date top-right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
        {!done && m.hall_name && (
          <span style={{ fontSize: 13, color: COLOR.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.hall_name}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: COLOR.ink2, flexShrink: 0 }}>
          {dayTag(m.match_date)}
        </span>
      </div>

      {/* Teams face off across the centre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>{teamName(m.home_team_name, m.home_bits_team_id, hw, 'right')}</div>

        <div style={{ flexShrink: 0, minWidth: 66, textAlign: 'center' }}>
          {done ? (
            <span style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6,
              fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums',
            }}>
              {scoreCell(m.home_result, hw)}
              <span style={{ fontSize: 15, color: COLOR.ink3 }}>–</span>
              {scoreCell(m.away_result, aw)}
            </span>
          ) : (
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: 1, color: COLOR.ink2 }}>vs</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>{teamName(m.away_team_name, m.away_bits_team_id, aw, 'left')}</div>
      </div>
    </Link>
  )
}

// ── Round: a quiet sticky header, then its fixtures flowing on the page ────────
function Round({ group, isNext, teamHref }: { group: RoundGroup<MatchRow>; isNext: boolean; teamHref: (bitsId: number) => string }) {
  return (
    <section style={{ marginBottom: 10 }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        display: 'flex', alignItems: 'baseline', gap: 10,
        padding: '18px 20px 10px', background: COLOR.bg,
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2 }}>
          {group.label.toUpperCase()}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 13,
          fontWeight: isNext ? 700 : 500, color: isNext ? COLOR.gold : COLOR.ink2,
        }}>
          {isNext ? 'spelas härnäst' : roundDateLabel(group.firstDate, group.lastDate)}
        </span>
      </div>
      {group.matches.map(m => <Fixture key={m.bits_match_id} m={m} teamHref={teamHref} />)}
    </section>
  )
}

export function DivisionMatches({ matches, teamHref }: {
  matches: MatchRow[]; teamHref: (bitsId: number) => string
}) {
  if (matches.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, padding: '64px 0' }}>
        Inga matcher synkade ännu
      </div>
    )
  }

  const rounds   = groupByRound(matches)
  const upcoming = rounds.filter(r => !r.played)
  const played   = rounds.filter(r =>  r.played).reverse()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {upcoming.map((g, i) => <Round key={g.key} group={g} isNext={i === 0} teamHref={teamHref} />)}
      {played.map(g => <Round key={g.key} group={g} isNext={false} teamHref={teamHref} />)}
    </motion.div>
  )
}
