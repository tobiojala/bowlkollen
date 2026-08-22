'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { COLOR, FONT, SPACE } from '@/lib/brand'
import { divisionTier, TIER_COLOR, type TeamStanding, type MatchRow } from '@/lib/division-standings'
import { DivisionActions } from './DivisionActions'
import { DivisionMatches } from './DivisionMatches'
import { DivisionStandings } from './DivisionStandings'
import { SeasonPills } from './SeasonPills'

type Props = {
  divisionId:     number
  divisionName:   string
  seasonYear:     number
  seasons:        number[]
  matches:        MatchRow[]
  standings:      TeamStanding[]
  teamFilterName: string | null
  teamFilterId:   number | null
}

export function DivisionClient({ divisionId, divisionName, seasonYear, seasons, matches, standings, teamFilterName, teamFilterId }: Props) {
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
      <style>{`
        .div-wrap { max-width: 600px; margin: 0 auto; padding-bottom: 96px; }
        .div-grid { display: block; }
        .div-standings { display: block; margin-bottom: 24px; }
        @media (min-width: 1024px) {
          .div-wrap { max-width: 1160px; padding: 0 32px 96px; }
          .div-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
          .div-standings { display: block; position: sticky; top: 88px; margin-bottom: 0; }
        }
      `}</style>
      <div className="div-wrap">

        {/* Header — back steps lens → division → schema */}
        <div style={{ padding: `${SPACE[6]}px ${SPACE[4]}px ${SPACE[2]}px` }}>
          <Link href={teamFilterName ? `/divisioner/${divisionId}` : '/schema'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontSize: 14, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4],
          }}>
            <ChevronLeft size={15} /> {teamFilterName ? divisionName : 'Alla divisioner'}
          </Link>

          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: SPACE[1] }}>
            {teamFilterName ? `${tier.toUpperCase()} · ${divisionName}` : tier.toUpperCase()}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: COLOR.ink, margin: 0 }}>
            {teamFilterName ?? divisionName}
          </h1>

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
            />
          )}

          <SeasonPills divisionId={divisionId} seasons={seasons} selected={seasonYear} teamId={teamFilterId} />

          {/* Elitserien's season ends in the SM-slutspel — it belongs here, not
              in Competitions. Shown on both Elitserien Herrar and Damer. */}
          {tier === 'Elitserien' && (
            <Link href={`/sm-slutspel?gender=${divisionName.toLowerCase().includes('dam') ? 'damer' : 'herrar'}`} style={{
              display: 'flex', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[4],
              padding: `${SPACE[3]}px ${SPACE[4]}px`, background: `${COLOR.gold}18`, borderRadius: 16, textDecoration: 'none',
            }}>
              <Trophy size={20} color={COLOR.gold} strokeWidth={2} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: COLOR.ink }}>SM-slutspel</span>
                <span style={{ display: 'block', fontSize: 13, color: COLOR.ink3, marginTop: 2 }}>Seriens avslut — semifinaler och final</span>
              </span>
              <ChevronRight size={16} color={COLOR.ink3} />
            </Link>
          )}
        </div>

        <div className="div-grid">
          {/* Desktop: standings table sits beside the schedule (mobile uses the sheet) */}
          <aside className="div-standings">
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2, padding: `0 ${SPACE[2]}px ${SPACE[3]}px` }}>
              TABELL
            </div>
            <DivisionStandings standings={standings} tierColor={tierColor} />
          </aside>

          {/* The schedule is the page */}
          <div className="div-schedule">
            <DivisionMatches matches={matches} teamHref={teamHref} />
          </div>
        </div>

        {/* Quiet season summary at the foot — for anyone who wants the counts,
            out of the way of the header. */}
        <div style={{ padding: `${SPACE[8]}px 20px 0`, fontSize: 13, color: COLOR.ink3, textAlign: 'center' }}>
          Säsong {seasonYear} · {played} spelade · {upcoming} kommande
        </div>
      </div>
    </main>
  )
}
