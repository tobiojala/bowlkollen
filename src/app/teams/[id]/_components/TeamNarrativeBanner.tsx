'use client'

import React from 'react'
import { useColors } from '@/components/ThemeProvider'
import { useTeamMatches, useTeamDivisionMatches } from '@/lib/queries'
import { computeTeamNarrative } from '@/lib/team-narrative'
import type { TableRow, FormResult, StandingsMatch } from '@/lib/types'

type Props = { id: string }

function buildTable(
  matches: { home_team_id: string; away_team_id: string; home_score: number; away_score: number }[]
): TableRow[] {
  const pts: Record<string, { p: number; w: number; d: number; l: number }> = {}
  for (const m of matches) {
    for (const tid of [m.home_team_id, m.away_team_id]) {
      if (!pts[tid]) pts[tid] = { p: 0, w: 0, d: 0, l: 0 }
    }
    if (m.home_score > m.away_score) { pts[m.home_team_id].p += 2; pts[m.home_team_id].w++; pts[m.away_team_id].l++ }
    else if (m.home_score < m.away_score) { pts[m.away_team_id].p += 2; pts[m.away_team_id].w++; pts[m.home_team_id].l++ }
    else { pts[m.home_team_id].p++; pts[m.away_team_id].p++; pts[m.home_team_id].d++; pts[m.away_team_id].d++ }
  }
  return Object.entries(pts)
    .sort((a, b) => b[1].p - a[1].p)
    .map(([teamId, s], i) => ({
      rank: i + 1, teamId, teamName: '', played: s.w + s.d + s.l,
      won: s.w, drawn: s.d, lost: s.l, points: s.p, form: [],
    }))
}

export default function TeamNarrativeBanner({ id }: Props) {
  const { C, isDark } = useColors()
  const { data: teamMatches = [] } = useTeamMatches(id)

  const completed = (teamMatches as any[]).filter((m: any) => m.status === 'completed' && m.home_score !== null)
  const upcoming  = (teamMatches as any[]).filter((m: any) => m.status === 'upcoming' || m.status === 'live')
  const division  = completed[0]?.division ?? upcoming[0]?.division ?? null

  const { data: divMatches = [] } = useTeamDivisionMatches(division)
  const table = buildTable(divMatches)

  const form: FormResult[] = completed.slice(0, 5).map((m: any) => {
    const isHome = m.home_team_id === id
    const my  = isHome ? m.home_score : m.away_score
    const opp = isHome ? m.away_score : m.home_score
    return my > opp ? 'W' : my < opp ? 'L' : 'D'
  })

  const totalTeams    = table.length
  const totalMatches  = totalTeams > 1 ? (totalTeams - 1) * 2 : 0
  const playedMatches = completed.length

  const lastMatch     = completed[0]
  const nextMatch     = upcoming[0]
  const lastResult    = lastMatch
    ? (lastMatch.home_team_id === id ? lastMatch.home_score > lastMatch.away_score : lastMatch.away_score > lastMatch.home_score) ? 'W'
    : (lastMatch.home_team_id === id ? lastMatch.home_score < lastMatch.away_score : lastMatch.away_score < lastMatch.home_score) ? 'L' : 'D'
    : null

  const narrative = computeTeamNarrative({
    teamId: id, table, totalMatches, playedMatches, form,
    upcomingOpponentId: nextMatch ? (nextMatch.home_team_id === id ? nextMatch.away_team_id : nextMatch.home_team_id) : null,
    lastOpponentId:     lastMatch  ? (lastMatch.home_team_id  === id ? lastMatch.away_team_id  : lastMatch.home_team_id)  : null,
    lastMatchResult:    lastResult as 'W' | 'D' | 'L' | null,
  })

  if (!narrative.headline) return null

  const accentMap: Record<string, string> = {
    promotion_chase:   C.accent,
    playoff_push:      C.accent,
    dominant_form:     '#f97316',
    comeback_run:      C.green,
    relegation_battle: '#ef4444',
    survival_confirmed: C.green,
    rivalry_match:     '#a855f7',
    revenge_opportunity: '#f97316',
  }
  const color = accentMap[narrative.archetype] ?? C.accent

  return (
    <div
      className="mx-4 mb-4 rounded-2xl px-4 py-3"
      style={{ background: color + (isDark ? '12' : '10'), border: '1px solid ' + color + '30' }}
    >
      <div className="text-base font-black leading-tight" style={{ color: isDark ? '#fff' : '#111' }}>
        {narrative.headline}
      </div>
      {narrative.subtext && (
        <div className="mt-0.5 text-xs" style={{ color: C.muted }}>{narrative.subtext}</div>
      )}
    </div>
  )
}
