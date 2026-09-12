'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { COLOR, FONT } from '@/lib/brand'
import { MatchResults } from './MatchResults'
import { useLiveMatch, type LiveScores } from './use-live-match'
import type { PlayerLine } from './TeamScoreSection'

const toLine = (p: LiveScores['players'][number]): PlayerLine => ({ name: p.name, games: p.games, total: p.total, publicId: null })
const sum = (a: number[]) => a.reduce((t, n) => t + n, 0)
const hhmmss = (iso: string) => { try { return new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } catch { return '' } }

// Live serie-by-serie board for a match in progress — polls BITS and shows what's
// been rolled so far, running pinfall, and a live pulse. Reuses MatchResults so it
// reads exactly like the finished scorecard, just live.
export function LiveScoreboard({ matchId, homeTeamName, awayTeamName }: { matchId: number; homeTeamName: string; awayTeamName: string }) {
  const { data, isLoading, isError } = useLiveMatch(matchId, true)
  const router = useRouter()
  const finalizing = useRef(false)

  // The moment BITS reports the match finished, finalize it into our DB (results +
  // is_finished) on demand, then refresh so the real finished match page renders —
  // instead of sitting on the live board until the 3h cron catches up.
  useEffect(() => {
    if (!data?.finished || finalizing.current) return
    finalizing.current = true
    fetch(`/api/live/${matchId}`, { method: 'POST' })
      .then((r) => r.json())
      .then((res) => { if (res?.finished) router.refresh() })
      .catch(() => { finalizing.current = false })
  }, [data?.finished, matchId, router])

  const homeSeries = data?.series.teamA ?? []
  const awaySeries = data?.series.teamB ?? []
  const serieCount = Math.max(homeSeries.length, awaySeries.length)
  const homeTotal = sum(homeSeries)
  const awayTotal = sum(awaySeries)
  const hasData = serieCount > 0
  const banp = data?.banp ?? { home: 0, away: 0, completedSeries: 0 }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(224,85,85,0.12)', border: `1px solid ${COLOR.red}`, borderRadius: 999, padding: '4px 11px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLOR.red, animation: 'bk-live-pulse 1.5s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.red }}>LIVE</span>
        </span>
        {banp.completedSeries > 0 && (
          <span style={{ fontFamily: FONT.score, fontWeight: 800, fontSize: 26, color: COLOR.ink, letterSpacing: '-.02em' }}>
            {banp.home} <span style={{ color: COLOR.ink4, fontWeight: 600 }}>–</span> {banp.away}
            <span style={{ fontSize: 12, fontWeight: 700, color: COLOR.ink3, marginLeft: 6 }}>poäng</span>
          </span>
        )}
        {data && <span style={{ fontSize: 11, color: COLOR.ink4, marginLeft: 'auto' }}>Uppdaterad {hhmmss(data.updatedAt)}</span>}
      </div>
      {hasData && (
        <div style={{ fontSize: 12, color: COLOR.ink3, marginBottom: 8 }}>
          Pinnfall {homeTotal} – {awayTotal}
          {banp.completedSeries > 0
            ? ` · efter ${banp.completedSeries} ${banp.completedSeries === 1 ? 'serie' : 'serier'}`
            : ' · serie 1 pågår'}
        </div>
      )}

      {!hasData ? (
        <div style={{ padding: '28px 0', textAlign: 'center', color: COLOR.ink3, fontSize: 14 }}>
          {isLoading ? 'Hämtar live-resultat…'
            : isError ? 'Kunde inte hämta live-resultat just nu — försöker igen.'
            : 'Matchen har börjat — första serien dyker upp här så fort den rullats.'}
        </div>
      ) : (
        <MatchResults
          homeTeamName={homeTeamName} awayTeamName={awayTeamName}
          serieCount={serieCount} homeSeries={homeSeries} awaySeries={awaySeries}
          homePlayers={(data?.players ?? []).filter(p => p.isHomeTeam).map(toLine)}
          awayPlayers={(data?.players ?? []).filter(p => !p.isHomeTeam).map(toLine)}
          homeWon={false} awayWon={false}
        />
      )}

      <style>{`@keyframes bk-live-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>
    </div>
  )
}
