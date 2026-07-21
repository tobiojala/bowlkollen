'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { COLOR, FONT, SPACE } from '@/lib/brand'
import { divisionTier, TIER_COLOR, type TeamStanding, type MatchRow } from '@/lib/division-standings'
import { DivisionActions } from './DivisionActions'
import { DivisionMatches } from './DivisionMatches'
import { StandingsSheet } from './StandingsSheet'

type Props = {
  divisionId:     number
  divisionName:   string
  seasonYear:     number
  matches:        MatchRow[]
  standings:      TeamStanding[]
  teamFilterName: string | null
  teamFilterId:   number | null
}

export function DivisionClient({ divisionId, divisionName, seasonYear, matches, standings, teamFilterName, teamFilterId }: Props) {
  const [tableOpen, setTableOpen] = useState(false)

  // In the lens, tapping the focused team drills into its team page; tapping an
  // opponent switches the lens to them. In the full division every team → lens.
  const teamHref = (bitsId: number) =>
    (teamFilterId != null && bitsId === teamFilterId)
      ? `/lag/${bitsId}`
      : `/divisioner/${divisionId}?team=${bitsId}`

  const tier      = divisionTier(divisionName)
  const tierColor = TIER_COLOR[tier] ?? COLOR.gold

  const played   = matches.filter(m => m.is_finished).length
  const upcoming = matches.length - played

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 96 }}>

        {/* Header — back steps lens → division → schema */}
        <div style={{ padding: `${SPACE[6]}px ${SPACE[4]}px ${SPACE[2]}px` }}>
          <Link href={teamFilterName ? `/divisioner/${divisionId}` : '/schema'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontSize: 14, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4],
          }}>
            <ChevronLeft size={15} /> {teamFilterName ? divisionName : 'Alla divisioner'}
          </Link>

          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: tierColor, marginBottom: SPACE[1] }}>
            {teamFilterName ? `${tier.toUpperCase()} · ${divisionName}` : tier.toUpperCase()}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: COLOR.ink, margin: 0 }}>
            {teamFilterName ?? divisionName}
          </h1>
          <div style={{ fontSize: 14, color: COLOR.ink2, marginTop: SPACE[1] }}>
            {teamFilterName
              ? `${played} spelade · ${upcoming} kommande`
              : `Säsong ${seasonYear} · ${played} spelade · ${upcoming} kommande`}
          </div>

          {teamFilterName ? (
            <Link href={`/divisioner/${divisionId}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: SPACE[4],
              fontSize: 14, fontWeight: 600, color: COLOR.gold, textDecoration: 'none',
            }}>
              ← Hela divisionen
            </Link>
          ) : (
            <DivisionActions
              divisionId={divisionId}
              divisionName={divisionName}
              matches={matches}
              onShowTable={() => setTableOpen(true)}
            />
          )}
        </div>

        {/* The schedule is the page */}
        <DivisionMatches matches={matches} teamHref={teamHref} />
      </div>

      <StandingsSheet
        open={tableOpen}
        onClose={() => setTableOpen(false)}
        standings={standings}
        tierColor={tierColor}
        divisionName={divisionName}
      />
    </main>
  )
}
