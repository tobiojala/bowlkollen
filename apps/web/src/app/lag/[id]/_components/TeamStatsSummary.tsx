'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useTeamStats } from '@/lib/team-stats-data'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { TeamStats } from '@bowlkollen/core'

// Compact team-stats summary on the team page — the profile-like headline
// (pinfall/match + form + a mini pinfall trend), a doorway to /statistik for the
// full leaderboard, compare, and share. Mirrors how the player profile leads
// with its numbers rather than hiding them behind a link.

function MiniTrend({ stats }: { stats: TeamStats }) {
  const vals = stats.trend.map(t => t.teamTotal)
  if (vals.length < 2) return null
  const min = Math.min(...vals), max = Math.max(...vals)
  const span = max - min || 1
  const W = 96, H = 34
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - ((v - min) / span) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }} aria-hidden>
      <polyline points={pts} fill="none" stroke={COLOR.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FormDots({ form }: { form: TeamStats['form'] }) {
  if (form.length === 0) return null
  const ordered = [...form].reverse() // newest last, reads left→right
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {ordered.map((o, i) => {
        const c = o === 'W' ? COLOR.green : o === 'L' ? COLOR.red : COLOR.ink3
        const letter = o === 'W' ? 'V' : o === 'L' ? 'F' : 'O'
        return (
          <span key={i} title={letter} style={{
            width: 18, height: 18, borderRadius: 5, background: `${c}22`, color: c,
            fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{letter}</span>
        )
      })}
    </div>
  )
}

export function TeamStatsSummary({ teamId }: { teamId: number }) {
  const { data } = useTeamStats(teamId)
  if (!data) return null // no finished matches → nothing to summarise yet
  const s = data.stats

  return (
    <Link href={`/lag/${teamId}/statistik`} style={{
      display: 'block', textDecoration: 'none',
      background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: 16, padding: `${SPACE[4]}px ${SPACE[4]}px`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[3] }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', color: COLOR.ink2, textTransform: 'uppercase' }}>Lagstatistik</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: TYPE.caption, color: COLOR.ink3 }}>
          Se allt <ChevronRight size={14} />
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACE[4] }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.06em', color: COLOR.ink3, textTransform: 'uppercase' }}>Pinfall / match</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: COLOR.gold, fontFamily: FONT.score, lineHeight: 1, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {s.pinfallPerMatch != null ? s.pinfallPerMatch.toLocaleString('sv-SE') : '–'}
          </div>
          <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 4 }}>
            {s.totalPinfall.toLocaleString('sv-SE')} pins totalt · {s.played} {s.played === 1 ? 'match' : 'matcher'} · {s.winPct}% vinst
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: SPACE[2], flexShrink: 0 }}>
          <MiniTrend stats={s} />
          <FormDots form={s.form} />
        </div>
      </div>
    </Link>
  )
}
