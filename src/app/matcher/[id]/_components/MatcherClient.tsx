'use client'

import Link from 'next/link'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { divisionTier, TIER_COLOR } from '@/lib/division-standings'
import type { BitsMatchDetail, BitsMatchPlayerResult } from '@/lib/types'
import { TeamScoreSection, type PlayerLine } from './TeamScoreSection'

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
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px 0 80px` }}>

        {/* Back */}
        <div style={{ padding: `0 ${SPACE[4]}px`, marginBottom: SPACE[4] }}>
          <Link href="/?tab=matcher" style={{ fontSize: TYPE.caption, color: COLOR.ink3, textDecoration: 'none' }}>
            ← Matcher
          </Link>
        </div>

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
              <div style={{
                fontSize: 17, fontWeight: homeWon ? 800 : 500,
                color: homeWon ? COLOR.ink : COLOR.ink3,
                lineHeight: 1.2,
              }}>
                {match.home_team_name}
              </div>
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
              <div style={{
                fontSize: 17, fontWeight: awayWon ? 800 : 500,
                color: awayWon ? COLOR.ink : COLOR.ink3,
                lineHeight: 1.2,
              }}>
                {match.away_team_name}
              </div>
            </div>
          </div>

          {match.oil_pattern && (
            <div style={{ marginTop: SPACE[4], fontSize: TYPE.micro, color: COLOR.ink3, textAlign: 'center' }}>
              Oljesystem: {match.oil_pattern}
            </div>
          )}
        </div>

        {/* Player scores — grouped by team first, so every player's full
            per-serie line is readable, instead of dumping all of one team's
            board-mates on one side of a duel-style row. */}
        {hasResults && (
          <div style={{ padding: `0 ${SPACE[4]}px` }}>
            <div style={{
              fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em',
              color: COLOR.ink3, marginBottom: SPACE[4],
            }}>
              SPELRESULTAT
            </div>

            {/* Per-serie team comparison */}
            <div style={{
              display: 'flex', gap: SPACE[2], padding: `${SPACE[2]}px 0`, marginBottom: SPACE[6],
              borderBottom: `1px solid ${COLOR.hairline}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }} />
              <div style={{ display: 'flex', gap: SPACE[2] }}>
                {Array.from({ length: serieCount }, (_, i) => (
                  <span key={i} style={{ width: 28, textAlign: 'center', fontSize: 9, fontWeight: 700, color: COLOR.ink4 }}>
                    S{i + 1}
                  </span>
                ))}
              </div>
              <span style={{ width: 34 }} />
            </div>
            {([
              { name: match.home_team_name, series: homeSeries, won: homeWon },
              { name: match.away_team_name, series: awaySeries, won: awayWon },
            ] as const).map(team => (
              <div key={team.name} style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], padding: '4px 0' }}>
                <div style={{
                  flex: 1, minWidth: 0, fontSize: TYPE.caption, fontWeight: team.won ? 700 : 500,
                  color: team.won ? COLOR.ink : COLOR.ink3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {team.name}
                </div>
                <div style={{ display: 'flex', gap: SPACE[2] }}>
                  {team.series.map((v, i) => (
                    <span key={i} style={{
                      width: 28, textAlign: 'center', fontSize: TYPE.caption, fontVariantNumeric: 'tabular-nums', color: COLOR.ink2,
                    }}>
                      {v}
                    </span>
                  ))}
                </div>
                <span style={{
                  width: 34, textAlign: 'right', fontSize: TYPE.caption, fontWeight: 700, fontFamily: FONT.display,
                  fontVariantNumeric: 'tabular-nums', color: team.won ? COLOR.green : COLOR.ink3,
                }}>
                  {team.series.reduce((a, b) => a + b, 0)}
                </span>
              </div>
            ))}

            <div style={{ marginTop: SPACE[6] }}>
              <TeamScoreSection
                teamName={match.home_team_name}
                players={homePlayers}
                serieCount={serieCount}
                total={homeSeries.reduce((a, b) => a + b, 0)}
                isWinner={homeWon}
              />
              <TeamScoreSection
                teamName={match.away_team_name}
                players={awayPlayers}
                serieCount={serieCount}
                total={awaySeries.reduce((a, b) => a + b, 0)}
                isWinner={awayWon}
              />
            </div>
          </div>
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
      </div>
    </main>
  )
}
