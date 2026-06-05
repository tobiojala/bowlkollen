'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { matchDivisionColor } from '@/lib/match-ui'
import { shortName } from '@/lib/utils'
import { MatchPageSkeleton } from '@/components/matches/MatchPageSkeleton'
import { MatchHeader } from '@/components/matches/MatchHeader'
import { MatchScorecard } from '@/components/matches/MatchScorecard'
import { MatchBestPlayer } from '@/components/matches/MatchBestPlayer'
import { MatchUpcomingPanel } from '@/components/matches/MatchUpcomingPanel'

type Props = { params: Promise<{ id: string }> }
type Lineup = { id: string; team_id: string; player_name: string; bord: number; position: number }
type Result = { id: string; team_id: string; bord: number; position: number; games: number[] }

export default function MatchPage({ params }: Props) {
  const { theme } = useTheme()
  const [id, setId] = useState<string | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [lineup, setLineup] = useState<Lineup[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSerie, setActiveSerie] = useState(0)
  const [playerIds, setPlayerIds] = useState<Record<string, string>>({})
  const [h2h, setH2h] = useState<any[]>([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    const loadAll = async () => {
      const [{ data: m }, { data: lu }, { data: rs }] = await Promise.all([
        supabase.from('matches').select('*, home:teams!home_team_id(id,name,club), away:teams!away_team_id(id,name,club)').eq('id', id).single(),
        supabase.from('match_lineups').select('*').eq('match_id', id).order('bord').order('position'),
        supabase.from('match_results').select('*').eq('match_id', id),
      ])
      setMatch(m)
      setLineup((lu || []) as Lineup[])
      setResults((rs || []) as Result[])

      const names = [...new Set((lu || []).map((l: { player_name: string }) => l.player_name).filter(Boolean))]
      if (names.length > 0) {
        const { data: players } = await supabase.from('players').select('id, name').in('name', names)
        if (players) {
          const map: Record<string, string> = {}
          players.forEach((p: { id: string; name: string }) => { map[p.name] = p.id })
          setPlayerIds(map)
        }
      }

      if (m) {
        const { data: h2hData } = await supabase
          .from('matches')
          .select('id, date, home_score, away_score, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
          .neq('id', id)
          .not('home_score', 'is', null)
          .or(`and(home_team_id.eq.${m.home_team_id},away_team_id.eq.${m.away_team_id}),and(home_team_id.eq.${m.away_team_id},away_team_id.eq.${m.home_team_id})`)
          .order('date', { ascending: false })
          .limit(5)
        setH2h(h2hData || [])
      }

      setLoading(false)
    }
    loadAll()
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    const channel = supabase
      .channel('match-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results', filter: 'match_id=eq.' + id }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_lineups', filter: 'match_id=eq.' + id }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: 'id=eq.' + id }, () => loadAll())
      .subscribe()
    return () => { clearInterval(ticker); supabase.removeChannel(channel) }
  }, [id])

  if (loading) return <MatchPageSkeleton />

  if (!match) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
        <p className="text-sm text-dark-muted">Match hittades inte</p>
      </main>
    )
  }

  const home = match.home
  const away = match.away
  const homeTotal = match.home_score
  const awayTotal = match.away_score
  const hasScore = homeTotal !== null && awayTotal !== null
  const isLive = match.status === 'live'
  const isUpcoming = match.status === 'upcoming'
  const hasLineup = lineup.length > 0
  const hasStream = !!match.stream_url?.length
  const divColor = matchDivisionColor(match.division)

  const getResult = (teamId: string, bord: number, pos: number) =>
    results.find(r => r.team_id === teamId && r.bord === bord && r.position === pos)

  const getScore = (teamId: string, bord: number, pos: number): number => {
    const games = getResult(teamId, bord, pos)?.games || []
    return activeSerie === 4 ? games.reduce((a, b) => a + b, 0) : games[activeSerie] || 0
  }

  const seriesTotal = (teamId: string, gi: number) =>
    results.filter(r => r.team_id === teamId).reduce((s, r) => s + ((r.games || [])[gi] || 0), 0)

  const grandTotal = (teamId: string) =>
    [0, 1, 2, 3].reduce((s, gi) => s + seriesTotal(teamId, gi), 0)

  const hGrand = grandTotal(match.home_team_id)
  const aGrand = grandTotal(match.away_team_id)

  const allPlayers = lineup.map(p => {
    const total = (getResult(p.team_id, p.bord, p.position)?.games || []).reduce((a, b) => a + b, 0)
    return { ...p, total }
  })
  const bestPlayer = allPlayers.length > 0
    ? allPlayers.reduce((best, p) => (p.total > best.total ? p : best))
    : null

  const dateStr = match.date
    ? new Date(match.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''
  const timeStr = match.date
    ? new Date(match.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    : ''

  const serieSummary = [0, 1, 2, 3]
    .map(gi => ({ gi, h: seriesTotal(match.home_team_id, gi), a: seriesTotal(match.away_team_id, gi) }))
    .filter(s => s.h > 0 || s.a > 0)

  const matchTime = match.date ? new Date(match.date).getTime() : null
  const msLeft = matchTime ? Math.max(0, matchTime - now) : null
  const matchStarted = msLeft === 0
  const matchLabel = `${shortName(home?.name || '')} vs ${shortName(away?.name || '')}`

  return (
    <main className="min-h-screen bg-light-bg font-sans bk-text-primary dark:bg-dark-bg">
      <div className="mx-auto max-w-app pb-20">
        <MatchHeader
          division={match.division}
          divisionColor={divColor}
          round={match.round}
          status={match.status}
          home={home}
          away={away}
          homeTotal={homeTotal}
          awayTotal={awayTotal}
          hGrand={hGrand}
          aGrand={aGrand}
          dateStr={dateStr}
          timeStr={timeStr}
          venue={match.venue}
          oilProfile={match.oil_profile}
          streamUrl={match.stream_url}
        />

        {hasLineup && (
          <MatchScorecard
            homeTeamId={match.home_team_id}
            awayTeamId={match.away_team_id}
            homeName={home?.name || ''}
            awayName={away?.name || ''}
            lineup={lineup}
            activeSerie={activeSerie}
            onSerieChange={setActiveSerie}
            serieSummary={serieSummary}
            getScore={getScore}
            playerIds={playerIds}
            matchLabel={matchLabel}
            dark={theme === 'dark'}
          />
        )}

        {bestPlayer && bestPlayer.total > 0 && (
          <MatchBestPlayer
            playerName={bestPlayer.player_name}
            teamName={bestPlayer.team_id === match.home_team_id ? home?.name || '' : away?.name || ''}
            total={bestPlayer.total}
            playerId={playerIds[bestPlayer.player_name] ?? null}
            divisionColor={divColor}
          />
        )}

        {!hasLineup && isUpcoming && (
          <MatchUpcomingPanel msLeft={msLeft} matchStarted={matchStarted} h2h={h2h} />
        )}

        {!hasLineup && !isUpcoming && !isLive && hasScore && (
          <p className="px-4 py-6 text-center text-xs text-dark-muted">
            Detaljerade spelresultat ej registrerade
          </p>
        )}

        {hasStream && !isLive && (
          <div className="flex items-center justify-between border-t border-light-border px-4 py-3 dark:border-dark-border">
            <span className="text-xs text-dark-muted">Scoring från matchen</span>
            <a
              href={match.stream_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-gold no-underline"
            >
              Öppna scoring ↗
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
