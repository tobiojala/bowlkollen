'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { divisionTier, TIER_COLOR } from '@/lib/division-standings'
import type { BitsMatchDetail, BitsMatchPlayerResult } from '@/lib/types'
import { type PlayerLine } from './TeamScoreSection'
import { MatchResults } from './MatchResults'
import { DelmatchBoard } from './DelmatchBoard'
import { RivalryCallout } from './RivalryCallout'
import { useMatchDelmatch, useMatchRivalry } from './use-match-bord'

type Props = {
  match:   BitsMatchDetail
  results: BitsMatchPlayerResult[]
}

function dateStr(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function teamLines(results: BitsMatchPlayerResult[], isHome: boolean): PlayerLine[] {
  return results
    .filter(r => r.is_home_team === isHome)
    .map(r => ({ name: r.player_name, games: r.series, total: r.total_result, publicId: r.public_id ?? null }))
    .sort((a, b) => b.total - a.total)
}

// Per-serie pin totals for one team, across all its players
function serieTotals(results: BitsMatchPlayerResult[], isHome: boolean, serieCount: number): number[] {
  const totals = Array(serieCount).fill(0)
  for (const r of results) {
    if (r.is_home_team !== isHome) continue
    r.series.forEach((g, i) => { totals[i] += g })
  }
  return totals
}

export default function MatcherClient({ match, results }: Props) {
  const router = useRouter()
  const bordRef = useRef<HTMLDivElement>(null)
  // Bordsvy + "hetaste bordet" — parity with native. Rivalry only makes sense
  // once we have per-bord data, so it's gated on the delmatch fetch.
  const { data: delmatch }  = useMatchDelmatch(match.bits_match_id)
  const hasDelmatch          = !!delmatch?.hasData
  const { data: rivalry }    = useMatchRivalry(match.bits_match_id, hasDelmatch)
  const openBord = () => bordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // Go back to wherever you came from (division, team schedule, feed…) rather
  // than a fixed destination; fall back to Schema on a cold/deep-link open.
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/schema')
  }
  const tier        = divisionTier(match.division_name ?? '')
  const tierColor    = TIER_COLOR[tier] ?? COLOR.gold
  const homeWon      = match.home_result != null && match.away_result != null && match.home_result > match.away_result
  const awayWon      = match.home_result != null && match.away_result != null && match.away_result > match.home_result
  const hasResults   = results.length > 0
  const serieCount   = hasResults ? Math.max(...results.map(r => r.series.length)) : 0
  const homePlayers  = hasResults ? teamLines(results, true)  : []
  const awayPlayers  = hasResults ? teamLines(results, false) : []
  const homeSeries   = hasResults ? serieTotals(results, true, serieCount)  : []
  const awaySeries   = hasResults ? serieTotals(results, false, serieCount) : []

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <style>{`
        .match-canvas { max-width: 600px; margin: 0 auto; padding: 24px 0 80px; }
        .match-grid { display: block; }
        @media (min-width: 1024px) {
          .match-canvas { max-width: 1160px; padding: 24px 32px 96px; }
          .match-grid { display: grid; grid-template-columns: 380px 1fr; gap: 40px; align-items: start; }
          .match-side { position: sticky; top: 24px; align-self: start; }
        }
      `}</style>
      <div className="match-canvas">

        {/* Back — returns to the list you came from */}
        <div style={{ padding: `0 ${SPACE[4]}px`, marginBottom: SPACE[4] }}>
          <button onClick={goBack} style={{
            display: 'inline-flex', alignItems: 'center', gap: 2, background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, fontSize: TYPE.caption, color: COLOR.ink2,
          }}>
            <ChevronLeft size={15} /> Tillbaka
          </button>
        </div>

        <div className="match-grid">
          {/* Side: the match identity — score hero + hetaste bordet (sticky on desktop) */}
          <div className="match-side">

        {/* Header card */}
        <div style={{
          margin: `0 ${SPACE[4]}px`,
          background: COLOR.surface, borderRadius: RADIUS.lg,
          padding: `${SPACE[6]}px ${SPACE[4]}px`,
          marginBottom: SPACE[4],
        }}>
          {/* Division + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[4] }}>
            <span style={{
              fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em',
              color: tierColor, background: `${tierColor}18`, border: `1px solid ${tierColor}44`,
              borderRadius: RADIUS.sm, padding: '3px 8px',
            }}>
              {match.division_name ?? tier}
            </span>
            {match.round_id && (
              <span style={{ fontSize: TYPE.micro, color: COLOR.ink3 }}>Omg {match.round_id}</span>
            )}
          </div>

          <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginBottom: SPACE[6], textTransform: 'capitalize' }}>
            {dateStr(match.match_date)}
            {match.hall_name && ` · ${match.hall_name}`}
            {match.hall_city && `, ${match.hall_city}`}
          </div>

          {/* Score hero */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {match.home_bits_team_id ? (
                <Link href={`/lag/${match.home_bits_team_id}`} style={{
                  display: 'block', fontSize: 17, fontWeight: homeWon ? 800 : 600,
                  color: homeWon ? COLOR.ink : COLOR.ink2, lineHeight: 1.2, textDecoration: 'none',
                }}>
                  {match.home_team_name}
                </Link>
              ) : (
                <div style={{ fontSize: 17, fontWeight: homeWon ? 800 : 600, color: homeWon ? COLOR.ink : COLOR.ink2, lineHeight: 1.2 }}>
                  {match.home_team_name}
                </div>
              )}
            </div>

            <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 100 }}>
              {match.is_finished && match.home_result != null && match.away_result != null ? (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'baseline', justifyContent: 'center',
                    gap: SPACE[2], fontVariantNumeric: 'tabular-nums',
                    fontFamily: FONT.display,
                  }}>
                    <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: homeWon ? COLOR.green : COLOR.ink2 }}>
                      {match.home_result}
                    </span>
                    <span style={{ fontSize: 20, color: COLOR.ink4 }}>–</span>
                    <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: awayWon ? COLOR.green : COLOR.ink2 }}>
                      {match.away_result}
                    </span>
                  </div>
                  {match.home_score != null && match.away_score != null && (
                    <div style={{ fontSize: TYPE.micro, color: COLOR.ink3, marginTop: SPACE[1], fontVariantNumeric: 'tabular-nums' }}>
                      {match.home_score} – {match.away_score} pins
                    </div>
                  )}
                </>
              ) : (
                <span style={{ fontSize: 24, fontWeight: 300, color: COLOR.ink4, letterSpacing: 4 }}>vs</span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
              {match.away_bits_team_id ? (
                <Link href={`/lag/${match.away_bits_team_id}`} style={{
                  display: 'block', fontSize: 17, fontWeight: awayWon ? 800 : 600,
                  color: awayWon ? COLOR.ink : COLOR.ink2, lineHeight: 1.2, textDecoration: 'none',
                }}>
                  {match.away_team_name}
                </Link>
              ) : (
                <div style={{ fontSize: 17, fontWeight: awayWon ? 800 : 600, color: awayWon ? COLOR.ink : COLOR.ink2, lineHeight: 1.2 }}>
                  {match.away_team_name}
                </div>
              )}
            </div>
          </div>

          {match.oil_pattern && (
            <div style={{ marginTop: SPACE[4], fontSize: TYPE.micro, color: COLOR.ink3, textAlign: 'center' }}>
              Oljesystem: {match.oil_pattern}
            </div>
          )}
        </div>

        {/* Hetaste bordet — the marquee career rivalry from this match */}
        {rivalry && (
          <div style={{ padding: `0 ${SPACE[4]}px` }}>
            <RivalryCallout rivalry={rivalry} onOpenBord={hasDelmatch ? openBord : undefined} />
          </div>
        )}

          </div>{/* /match-side */}

          {/* Main: the detail — bordsvy + full spelresultat */}
          <div className="match-main">

        {/* Bordsvy — the real 2v2 head-to-heads, not BITS' dense table */}
        {hasDelmatch && delmatch && (
          <div ref={bordRef} style={{ padding: `${SPACE[6]}px ${SPACE[4]}px 0` }}>
            <div style={{ fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: SPACE[4] }}>
              BORDSVY
            </div>
            <DelmatchBoard summary={delmatch} />
          </div>
        )}

        {/* Player scores — grouped by team, per-serie comparison + full lines */}
        {hasResults && (
          <MatchResults
            homeTeamName={match.home_team_name} awayTeamName={match.away_team_name}
            serieCount={serieCount} homeSeries={homeSeries} awaySeries={awaySeries}
            homePlayers={homePlayers} awayPlayers={awayPlayers} homeWon={homeWon} awayWon={awayWon}
          />
        )}

        {/* No scores yet */}
        {!hasResults && match.is_finished && (
          <div style={{ padding: `${SPACE[8]}px ${SPACE[4]}px`, textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.caption }}>
            Spelarresultat synkas inom kort
          </div>
        )}

        {!match.is_finished && (
          <div style={{ padding: `${SPACE[8]}px ${SPACE[4]}px`, textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.caption }}>
            Matchen är inte spelad än
          </div>
        )}

        {/* Division link */}
        {match.bits_division_id && (
          <div style={{ padding: `${SPACE[4]}px ${SPACE[4]}px 0`, textAlign: 'center' }}>
            <Link href={`/divisioner/${match.bits_division_id}`} style={{
              fontSize: TYPE.caption, color: COLOR.ink3, textDecoration: 'none',
            }}>
              Visa hela divisionen →
            </Link>
          </div>
        )}

          </div>{/* /match-main */}
        </div>{/* /match-grid */}
      </div>{/* /match-canvas */}
    </main>
  )
}
