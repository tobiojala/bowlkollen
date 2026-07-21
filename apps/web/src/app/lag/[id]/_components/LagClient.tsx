'use client'

import Link from 'next/link'
import Reveal from '@/components/Reveal'
import { COLOR, FONT, SPACE } from '@/lib/brand'
import { useTeamClaim } from '@/lib/queries'
import type { MatchRow, TeamStanding } from '@/lib/division-standings'
import { DivisionMatches } from '@/app/divisioner/[id]/_components/DivisionMatches'
import { LagHero } from './LagHero'
import { StandingsLadder } from './StandingsLadder'
import { CaptainToolbar } from './CaptainToolbar'
import { LagLineupPreview } from './LagLineupPreview'

type Standing      = { rank: number; total: number; points: number; played: number }
type SeasonSummary = { seasonLabel: string; divisionId: number; divisionName: string | null; standing: Standing; standings: TeamStanding[] }
type RosterRow     = { public_id: string; name: string; licence_average: number | null; appearances: number }

type Props = {
  teamId:       number
  teamName:     string
  clubId:       number | null
  divisionId:   number
  divisionName: string | null
  hallId:       number | null
  hallName:     string | null
  matches:      MatchRow[]
  standing:     Standing | null
  standings:    TeamStanding[]
  prevSeason:   SeasonSummary | null
  roster:       RosterRow[]
}

export function LagClient({ teamId, teamName, clubId, divisionId, divisionName, hallId, hallName, matches, standing, standings, prevSeason, roster }: Props) {
  const teamHref = (bitsId: number) => bitsId === teamId ? `/lag/${teamId}` : `/lag/${bitsId}`
  const { data: claim } = useTeamClaim(teamId)

  // Early season — no finished matches yet. Fall back to last season's table.
  const ladderHistorical  = standings.length === 0 && !!prevSeason
  const ladderStandings   = ladderHistorical ? prevSeason!.standings : standings
  const ladderDivisionId  = ladderHistorical ? prevSeason!.divisionId : divisionId

  const upcoming  = matches.filter(m => !m.is_finished)
  const nextMatch = upcoming[0] ?? null

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 96 }}>

        <LagHero
          teamId={teamId}
          teamName={teamName}
          clubId={clubId}
          divisionId={divisionId}
          divisionName={divisionName}
          hallId={hallId}
          hallName={hallName}
          matches={matches}
          standing={standing}
          standings={standings}
          prevSeason={prevSeason}
        />

        <div style={{ padding: '0 20px' }}>
          <LagLineupPreview teamId={teamId} nextMatch={nextMatch} />
          <CaptainToolbar teamId={teamId} claim={claim ?? null} upcoming={upcoming.slice(0, 2)} />
        </div>

        <StandingsLadder teamId={teamId} divisionId={ladderDivisionId} standings={ladderStandings} historical={ladderHistorical} />

        {/* Trupp — the roster, each player a doorway into their profile */}
        {roster.length > 0 && (
          <Reveal direction="up" distance={16}>
            <section style={{ marginTop: SPACE[4] }}>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2, padding: '0 20px 10px' }}>
                TRUPP
              </div>
              {roster.map(p => (
                <Link key={p.public_id} href={`/players/${p.public_id}`} style={{
                  display: 'flex', alignItems: 'center', gap: SPACE[3],
                  padding: '13px 20px', borderTop: `1px solid ${COLOR.hairline}`,
                  textDecoration: 'none', WebkitTapHighlightColor: 'transparent',
                }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 13, color: COLOR.ink2, whiteSpace: 'nowrap' }}>
                    {p.licence_average ? `snitt ${p.licence_average} · ` : ''}{p.appearances} {p.appearances === 1 ? 'match' : 'matcher'}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR.ink3}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </section>
          </Reveal>
        )}

        {/* Their season */}
        <Reveal direction="up" delay={0.05}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2, padding: `${SPACE[6]}px 20px 4px` }}>
            MATCHER
          </div>
          <DivisionMatches matches={matches} teamHref={teamHref} />
        </Reveal>
      </div>
    </main>
  )
}
