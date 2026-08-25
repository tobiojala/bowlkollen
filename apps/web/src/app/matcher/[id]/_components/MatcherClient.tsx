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
import { MatchBest } from './MatchBest'
import { Hojdpunkter } from './Hojdpunkter'
import { SeasonContext } from './SeasonContext'
import { UpcomingPanel } from './UpcomingPanel'
import { ProGate } from '@/components/ProGate'
import { useMatchDelmatch, useMatchRivalry } from './use-match-bord'
import { usePro } from '@/lib/pro'

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
    .map(r => ({ name: r.player_name, games: r.series, total: r.total_result, publicId: r.public_id ?? null, seasonAvg: r.season_avg ?? null }))
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
  const pro = usePro()
  // Bordsvy + "hetaste bordet" — parity with native. Rivalry only makes sense
  // once we have per-bord data, so it's gated on the delmatch fetch.
  const { data: bord }       = useMatchDelmatch(match.bits_match_id, match.season_id)
  const delmatch             = bord?.summary
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
  const topTotal     = hasResults ? Math.max(...results.map(r => r.total_result)) : 0
  const topPlayer    = topTotal > 0 ? results.find(r => r.total_result === topTotal) ?? null : null

  const teamNameStyle = (won: boolean): React.CSSProperties => ({
    fontSize: 22, fontWeight: won ? 800 : 600, color: won ? COLOR.ink : COLOR.ink2, lineHeight: 1.15,
    letterSpacing: '-0.01em', textDecoration: 'none', display: 'block',
  })

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <style>{`
        .match-canvas { max-width: 1320px; margin: 0 auto; padding: 24px 20px 96px; }
        @media (min-width: 768px) { .match-canvas { padding: 32px 40px 96px; } }
        .match-head { display: flex; flex-direction: column; gap: 32px; }
        .head-hero { max-width: 900px; }
        .head-rivalry { max-width: 620px; }
        @media (min-width: 1024px) {
          .match-head--rivalry { display: grid; grid-template-columns: 1fr 400px; gap: 48px; align-items: center; }
          .match-head--rivalry .head-hero { grid-column: 1; grid-row: 1; max-width: none; }
          .match-head--rivalry .head-rivalry { grid-column: 2; grid-row: 1; max-width: none; }
        }
        .hl { display: flex; flex-direction: column; gap: 16px; }
        @media (min-width: 1024px) { .hl { display: grid; grid-template-columns: 340px 1fr; align-items: stretch; } }
        .match-body { display: flex; flex-direction: column; gap: 48px; }
        @media (min-width: 1024px) {
          .match-body--split { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
        }
        /* One orchestrated page-load reveal, staggered; disabled for reduced-motion. */
        @media (prefers-reduced-motion: no-preference) {
          @keyframes match-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
          .rise { opacity: 0; animation: match-rise 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        }
      `}</style>
      <div className="match-canvas">

        {/* Back — returns to the list you came from */}
        <button onClick={goBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 2, background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, fontSize: TYPE.caption, color: COLOR.ink2, marginBottom: SPACE[6],
        }}>
          <ChevronLeft size={15} /> Tillbaka
        </button>

        {/* Header — hetaste bordet (left) beside the match hero (right) on desktop */}
        <div className={`match-head rise${rivalry ? ' match-head--rivalry' : ''}`} style={{ animationDelay: '40ms' }}>

        {/* ── Match hero — open, borderless, powerful ── */}
        <div className="head-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[3] }}>
          <span style={{
            fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em',
            color: tierColor, background: `${tierColor}18`, borderRadius: RADIUS.sm, padding: '3px 8px',
          }}>
            {match.division_name ?? tier}
          </span>
          {match.round_id && <span style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>Omg {match.round_id}</span>}
          <span style={{ fontSize: TYPE.caption, color: COLOR.ink3, textTransform: 'capitalize' }}>
            · {dateStr(match.match_date)}{match.hall_name ? ` · ${match.hall_name}` : ''}{match.hall_city ? `, ${match.hall_city}` : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4], paddingBottom: SPACE[6], borderBottom: `1px solid ${COLOR.hairline}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {match.home_bits_team_id
              ? <Link href={`/lag/${match.home_bits_team_id}`} style={teamNameStyle(homeWon)}>{match.home_team_name}</Link>
              : <div style={teamNameStyle(homeWon)}>{match.home_team_name}</div>}
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 132 }}>
            {match.is_finished && match.home_result != null && match.away_result != null ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: SPACE[3], fontVariantNumeric: 'tabular-nums', fontFamily: FONT.display }}>
                  <span style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: homeWon ? COLOR.ink : COLOR.ink2 }}>{match.home_result}</span>
                  <span style={{ fontSize: 26, color: COLOR.ink4 }}>–</span>
                  <span style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: awayWon ? COLOR.ink : COLOR.ink2 }}>{match.away_result}</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: COLOR.ink4, marginTop: SPACE[1] }}>BANPOÄNG</div>
                {match.home_score != null && match.away_score != null && (
                  <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: SPACE[1], fontVariantNumeric: 'tabular-nums' }}>
                    {match.home_score} – {match.away_score} pins
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: 24, fontWeight: 300, color: COLOR.ink4, letterSpacing: 4 }}>vs</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            {match.away_bits_team_id
              ? <Link href={`/lag/${match.away_bits_team_id}`} style={teamNameStyle(awayWon)}>{match.away_team_name}</Link>
              : <div style={teamNameStyle(awayWon)}>{match.away_team_name}</div>}
          </div>
        </div>

        {/* Season context — standings + head-to-head (free) */}
        {match.is_finished && <SeasonContext match={match} tier={tier} />}

        {match.oil_pattern && (
          <div style={{ marginTop: SPACE[3], fontSize: TYPE.micro, color: COLOR.ink3 }}>Oljesystem: {match.oil_pattern}</div>
        )}
        </div>{/* /hero focal width */}

        {/* Hetaste bordet — in the header, left of the hero on desktop */}
        {rivalry && (
          <div className="head-rivalry">
            <RivalryCallout rivalry={rivalry} onOpenBord={hasDelmatch ? openBord : undefined} />
          </div>
        )}

        </div>{/* /match-head */}

        {/* Matchens bästa (free) + Höjdpunkter (Pro), under the header */}
        {hasResults && (
          <div className="hl rise" style={{ marginTop: SPACE[6], animationDelay: '130ms' }}>
            {topPlayer && (
              <MatchBest
                name={topPlayer.player_name}
                teamName={topPlayer.is_home_team ? match.home_team_name : match.away_team_name}
                total={topTotal}
                publicId={topPlayer.public_id ?? null}
              />
            )}
            <ProGate>
              <Hojdpunkter results={results} delmatch={delmatch} />
            </ProGate>
          </div>
        )}

        {/* Detail — bordsvy + full spelresultat, side by side on desktop */}
        {(hasDelmatch || hasResults) && (
          <div className={`match-body rise${hasDelmatch && hasResults ? ' match-body--split' : ''}`} style={{ marginTop: SPACE[8], animationDelay: '210ms' }}>
            {hasDelmatch && delmatch && (
              <div ref={bordRef}>
                <div style={{ fontSize: TYPE.caption, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3, marginBottom: SPACE[4] }}>BORDSVY</div>
                <DelmatchBoard summary={delmatch} avg={bord?.avgByPublicId} showDeltas={pro} />
              </div>
            )}
            {hasResults && (
              <MatchResults
                homeTeamName={match.home_team_name} awayTeamName={match.away_team_name}
                serieCount={serieCount} homeSeries={homeSeries} awaySeries={awaySeries}
                homePlayers={homePlayers} awayPlayers={awayPlayers} homeWon={homeWon} awayWon={awayWon}
              />
            )}
          </div>
        )}

        {!hasResults && match.is_finished && (
          <div style={{ padding: `${SPACE[8]}px 0`, textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.caption }}>Spelarresultat synkas inom kort</div>
        )}
        {!match.is_finished && (
          <div style={{ maxWidth: 900 }}><UpcomingPanel match={match} /></div>
        )}

        {match.bits_division_id && (
          <div style={{ padding: `${SPACE[8]}px 0 0`, textAlign: 'center' }}>
            <Link href={`/divisioner/${match.bits_division_id}`} style={{ fontSize: TYPE.caption, color: COLOR.ink3, textDecoration: 'none' }}>
              Visa hela divisionen →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
