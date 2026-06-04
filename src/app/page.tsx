'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { shortName, shortDiv, dateLabel, countdown } from '@/lib/utils'
import HonorRoll from '@/components/home/HonorRoll'
import MiniStandings from '@/components/home/MiniStandings'
import { MatchDateGroup } from '@/components/home/MatchDateGroup'
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton'
import { TeamZoneCard } from '@/components/home/TeamZoneCard'
import MatchRow from '@/components/home/MatchRow'
import { HeroStrip, type StripItem } from '@/components/home/HeroStrip'
import { MyNextMatchCard } from '@/components/home/MyNextMatchCard'
import { MatchPulsen } from '@/components/home/MatchPulsen'
import { MyProfileCard } from '@/components/home/MyProfileCard'
import { cn } from '@/lib/cn'

// ── Types ─────────────────────────────────────────────────────────────────────
type Match = {
  id: string; date: string; status: string; division: string
  home_score: number | null; away_score: number | null
  home: { id: string; name: string }; away: { id: string; name: string }
  streams?: { url: string }[]
  venue?: string; oilProfile?: string
  gameNumber?: number; totalGames?: number
  individualGames?: { home: number[]; away: number[] }
  highSeries?: { playerName: string; score: number; team: 'home' | 'away' }[]
}
type HonorEntry = { playerName: string; score: number; matchId: string; seriesTotal?: number }
type TableRow  = { rank: number; teamId: string; teamName: string; played: number; won: number; drawn: number; lost: number; points: number }

// ── DEMO (set to false to use real Supabase data) ─────────────────────────────
const DEMO = false

const _now = Date.now()
const _today = new Date().toISOString().slice(0, 10)
const _yesterday = new Date(_now - 86400000).toISOString().slice(0, 10)
const _twoDaysAgo = new Date(_now - 2 * 86400000).toISOString().slice(0, 10)
const _tomorrow = new Date(_now + 86400000).toISOString().slice(0, 10)
const _in3h  = new Date(_now + 3 * 3600000).toISOString()
const _in7h  = new Date(_now + 7 * 3600000).toISOString()
const _in22h = new Date(_now + 22 * 3600000).toISOString()

const MOCK_LIVE: Match[] = [
  {
    id: 'demo-live-1', date: new Date().toISOString(), status: 'live',
    division: 'Elitserien Herrar', home_score: 5, away_score: 4,
    home: { id: 'demo-t1', name: 'IK Hakarpspojkarna' },
    away: { id: 'demo-t2', name: 'Mariestads BK' },
    streams: [{ url: 'https://www.youtube.com/watch?v=demoLive1' }],
    gameNumber: 3, totalGames: 4,
    individualGames: { home: [234, 198, 267], away: [212, 245, 221] },
    highSeries: [{ playerName: 'Jesper Svensson', score: 267, team: 'home' }],
  },
  {
    id: 'demo-live-2', date: new Date().toISOString(), status: 'live',
    division: 'Elitserien Damer', home_score: 4, away_score: 4,
    home: { id: 'demo-t5', name: 'Örebro BK' },
    away: { id: 'demo-t6', name: 'Malmö BK' },
    streams: [
      { url: 'https://www.svtplay.se/demo' },
      { url: 'https://www.svenskbowling.tv/demo' },
    ],
    gameNumber: 4, totalGames: 4,
    individualGames: { home: [178, 223, 201, 256], away: [212, 198, 234, 214] },
    highSeries: [
      { playerName: 'Sara Holmberg', score: 256, team: 'home' },
      { playerName: 'Anna Karlsson', score: 234, team: 'away' },
    ],
  },
  {
    id: 'demo-live-3', date: new Date().toISOString(), status: 'live',
    division: 'Allsvenskan Herrar', home_score: 2, away_score: 4,
    home: { id: 'demo-t3', name: 'Göteborgs BK' },
    away: { id: 'demo-t4', name: 'Linköpings BK' },
    gameNumber: 2, totalGames: 4,
    individualGames: { home: [156, 178], away: [201, 234] },
    highSeries: [{ playerName: 'Marcus Lindgren', score: 234, team: 'away' }],
  },
]

const MOCK_UPCOMING: Match[] = [
  {
    id: 'demo-up-1', date: _in3h, status: 'upcoming', division: 'Allsvenskan Herrar',
    home_score: null, away_score: null,
    home: { id: 'demo-t3', name: 'Göteborgs BK' },
    away: { id: 'demo-t4', name: 'Linköpings BK' },
    venue: 'Göteborg Bowlinghall', oilProfile: 'PBA Shark',
  },
  {
    id: 'demo-up-2', date: _in7h, status: 'upcoming', division: 'Allsvenskan Damer',
    home_score: null, away_score: null,
    home: { id: 'demo-t5', name: 'Örebro BK' },
    away: { id: 'demo-t6', name: 'Malmö BK' },
  },
  {
    id: 'demo-up-3', date: _in7h, status: 'upcoming', division: 'Div 1 Södra Herrar',
    home_score: null, away_score: null,
    home: { id: 'demo-t9', name: 'Halmstad BK' },
    away: { id: 'demo-t10', name: 'Helsingborg BK' },
  },
  {
    id: 'demo-up-4', date: _in22h, status: 'upcoming', division: 'Elitserien Damer',
    home_score: null, away_score: null,
    home: { id: 'demo-t7', name: 'Jönköpings BK' },
    away: { id: 'demo-t8', name: 'Borås BK' },
  },
  {
    id: 'demo-up-5', date: _tomorrow + 'T16:00:00', status: 'upcoming', division: 'SM-final Herrar',
    home_score: null, away_score: null,
    home: { id: 'demo-t1', name: 'IK Hakarpspojkarna' },
    away: { id: 'demo-t3', name: 'Göteborgs BK' },
  },
]

const MOCK_RECENT: Match[] = [
  {
    id: 'demo-r-1', date: _yesterday + 'T19:00:00', status: 'completed',
    division: 'Elitserien Herrar', home_score: 6, away_score: 2,
    home: { id: 'demo-t1', name: 'IK Hakarpspojkarna' },
    away: { id: 'demo-t4', name: 'Linköpings BK' },
  },
  {
    id: 'demo-r-2', date: _yesterday + 'T19:00:00', status: 'completed',
    division: 'Allsvenskan Damer', home_score: 4, away_score: 4,
    home: { id: 'demo-t6', name: 'Malmö BK' },
    away: { id: 'demo-t7', name: 'Jönköpings BK' },
  },
  {
    id: 'demo-r-3', date: _yesterday + 'T17:00:00', status: 'completed',
    division: 'Div 1 Norra Herrar', home_score: 3, away_score: 5,
    home: { id: 'demo-t9', name: 'Halmstad BK' },
    away: { id: 'demo-t10', name: 'Helsingborg BK' },
  },
  {
    id: 'demo-r-4', date: _yesterday + 'T17:00:00', status: 'completed',
    division: 'Allsvenskan Herrar', home_score: 3, away_score: 5,
    home: { id: 'demo-t3', name: 'Göteborgs BK' },
    away: { id: 'demo-t2', name: 'Mariestads BK' },
  },
  {
    id: 'demo-r-5', date: _twoDaysAgo + 'T16:00:00', status: 'completed',
    division: 'Elitserien Damer', home_score: 5, away_score: 3,
    home: { id: 'demo-t8', name: 'Borås BK' },
    away: { id: 'demo-t5', name: 'Örebro BK' },
  },
  {
    id: 'demo-r-6', date: _twoDaysAgo + 'T14:00:00', status: 'completed',
    division: 'Allsvenskan Herrar', home_score: 7, away_score: 1,
    home: { id: 'demo-t2', name: 'Mariestads BK' },
    away: { id: 'demo-t9', name: 'Halmstad BK' },
  },
]

const MOCK_HONOR: HonorEntry[] = [
  { playerName: 'Jesper Svensson', score: 300, matchId: 'demo-r-1', seriesTotal: 1064 },
  { playerName: 'Martin Larsen',   score: 289, matchId: 'demo-r-2', seriesTotal: 990 },
  { playerName: 'Marcus Lindgren', score: 279, matchId: 'demo-r-1' },
  { playerName: 'Sara Holmberg',   score: 256, matchId: 'demo-r-2' },
  { playerName: 'Jonas Persson',   score: 245, matchId: 'demo-r-3' },
  { playerName: 'Anna Karlsson',   score: 234, matchId: 'demo-r-4' },
  { playerName: 'Erik Svensson',   score: 224, matchId: 'demo-r-5' },
]

const MOCK_TABLES: Record<string, TableRow[]> = {
  'Allsvenskan Herrar': [
    { rank: 1, teamId: 'demo-t17', teamName: 'Sundsvalls BK',     played: 10, won: 8, drawn: 1, lost: 1, points: 26 },
    { rank: 2, teamId: 'demo-t18', teamName: 'Skövde BK',         played: 10, won: 7, drawn: 0, lost: 3, points: 22 },
    { rank: 3, teamId: 'demo-t19', teamName: 'IFK Göteborg BK',   played: 10, won: 6, drawn: 1, lost: 3, points: 20 },
    { rank: 4, teamId: 'demo-t3',  teamName: 'Göteborgs BK',      played: 10, won: 5, drawn: 2, lost: 3, points: 18 },
    { rank: 5, teamId: 'demo-t20', teamName: 'Västervik BK',      played: 10, won: 5, drawn: 0, lost: 5, points: 15 },
    { rank: 6, teamId: 'demo-t21', teamName: 'Nacka BK',          played: 10, won: 3, drawn: 2, lost: 5, points: 11 },
    { rank: 7, teamId: 'demo-t22', teamName: 'Trollhättans BK',   played: 10, won: 2, drawn: 1, lost: 7, points:  8 },
    { rank: 8, teamId: 'demo-t23', teamName: 'Uddevalla BK',      played: 10, won: 1, drawn: 0, lost: 9, points:  3 },
  ],
  'Elitserien Herrar': [
    { rank: 1, teamId: 'demo-t1',  teamName: 'IK Hakarpspojkarna', played: 14, won: 11, drawn: 1, lost: 2,  points: 34 },
    { rank: 2, teamId: 'demo-t2',  teamName: 'Mariestads BK',       played: 14, won: 10, drawn: 1, lost: 3,  points: 31 },
    { rank: 3, teamId: 'demo-t3',  teamName: 'Göteborgs BK',        played: 14, won: 8,  drawn: 2, lost: 4,  points: 26 },
    { rank: 4, teamId: 'demo-t4',  teamName: 'Linköpings BK',       played: 14, won: 7,  drawn: 1, lost: 6,  points: 22 },
    { rank: 5, teamId: 'demo-t11', teamName: 'Örebro BK',           played: 14, won: 5,  drawn: 3, lost: 6,  points: 18 },
    { rank: 6, teamId: 'demo-t12', teamName: 'Lidköpings BSK',      played: 14, won: 4,  drawn: 2, lost: 8,  points: 14 },
    { rank: 7, teamId: 'demo-t13', teamName: 'Enköpings BS',        played: 14, won: 2,  drawn: 2, lost: 10, points: 8  },
    { rank: 8, teamId: 'demo-t14', teamName: 'Halmstad BK',         played: 14, won: 1,  drawn: 2, lost: 11, points: 5  },
  ],
  'Elitserien Damer': [
    { rank: 1, teamId: 'demo-t5',  teamName: 'Örebro BK',           played: 12, won: 9,  drawn: 2, lost: 1,  points: 29 },
    { rank: 2, teamId: 'demo-t6',  teamName: 'Malmö BK',            played: 12, won: 8,  drawn: 1, lost: 3,  points: 25 },
    { rank: 3, teamId: 'demo-t7',  teamName: 'Jönköpings BK',       played: 12, won: 7,  drawn: 2, lost: 3,  points: 23 },
    { rank: 4, teamId: 'demo-t8',  teamName: 'Borås BK',            played: 12, won: 5,  drawn: 1, lost: 6,  points: 16 },
    { rank: 5, teamId: 'demo-t9',  teamName: 'Halmstad BK',         played: 12, won: 4,  drawn: 2, lost: 6,  points: 14 },
    { rank: 6, teamId: 'demo-t10', teamName: 'Helsingborg BK',      played: 12, won: 3,  drawn: 1, lost: 8,  points: 10 },
    { rank: 7, teamId: 'demo-t15', teamName: 'Sollentuna BK',       played: 12, won: 2,  drawn: 1, lost: 9,  points: 7  },
    { rank: 8, teamId: 'demo-t16', teamName: 'Uppsala BK',          played: 12, won: 1,  drawn: 0, lost: 11, points: 3  },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function divColor(d: string) {
  if (d.includes('SM') || d.includes('slutspel')) return 'hsl(44, 50%, 52%)'
  if (d.includes('Damer'))      return 'hsl(320, 30%, 58%)'
  if (d.includes('Elitserien')) return 'hsl(210, 35%, 55%)'
  if (d.includes('Allsvenskan'))return 'hsl(130, 22%, 50%)'
  return 'hsl(35, 12%, 52%)'
}

function group(ms: Match[]) {
  const byDate: Record<string, Match[]> = {}
  ms.forEach(m => {
    const d = m.date.slice(0, 10)
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(m)
  })
  return byDate
}

type StandingsMatch = { home_team_id: string; away_team_id: string; home_score: number | null; away_score: number | null; division: string; home: { id: string; name: string }; away: { id: string; name: string } }
function calcHomeStandings(matches: StandingsMatch[], division: string): TableRow[] {
  const divMatches = matches.filter(m => m.division === division && m.home_score !== null)
  const table: Record<string, TableRow & { diff: number }> = {}
  divMatches.forEach(m => {
    const hid = m.home_team_id, aid = m.away_team_id
    if (!table[hid]) table[hid] = { rank: 0, teamId: hid, teamName: m.home.name, played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0 }
    if (!table[aid]) table[aid] = { rank: 0, teamId: aid, teamName: m.away.name, played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0 }
    const hs = m.home_score!, as_ = m.away_score!
    table[hid].played++; table[aid].played++
    table[hid].diff += hs - as_; table[aid].diff += as_ - hs
    if (hs > as_)      { table[hid].won++;   table[hid].points += 2; table[aid].lost++ }
    else if (as_ > hs) { table[aid].won++;   table[aid].points += 2; table[hid].lost++ }
    else               { table[hid].drawn++; table[hid].points++;     table[aid].drawn++; table[aid].points++ }
  })
  return Object.values(table)
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.won - a.won)
    .map((s, i) => ({ rank: i + 1, teamId: s.teamId, teamName: s.teamName, played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, points: s.points }))
}

const MOCK_MY_PLAYER = {
  name: 'Marcus Lindgren',
  team: 'Göteborgs BK',
  teamId: 'demo-t3',
  division: 'Allsvenskan Herrar',
  average: 194,
  lastScores: [178, 189, 234, 201, 212],
  teamRank: 4,
}

// Zone thresholds per division — promotionRanks = top N promoted, playoffRanks = top N to SM-slutspel
const DIVISION_ZONES: Record<string, { promotionRanks?: number; playoffRanks?: number; relegationRanks: number; totalGames: number }> = {
  'Elitserien Herrar':  { playoffRanks: 4, relegationRanks: 2, totalGames: 14 },
  'Elitserien Damer':   { playoffRanks: 4, relegationRanks: 2, totalGames: 12 },
  'Allsvenskan Herrar': { promotionRanks: 2, relegationRanks: 2, totalGames: 14 },
  'Allsvenskan Damer':  { promotionRanks: 2, relegationRanks: 2, totalGames: 14 },
  'Div 1 Södra Herrar': { promotionRanks: 2, relegationRanks: 2, totalGames: 14 },
  'Div 1 Norra Herrar': { promotionRanks: 2, relegationRanks: 2, totalGames: 14 },
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [live, setLive] = useState<Match[]>([])
  const [recent, setRecent] = useState<Match[]>([])
  const [upcoming, setUpcoming] = useState<Match[]>([])
  const [honor, setHonor] = useState<HonorEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'alla' | 'foljer'>('alla')
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [session, setSession] = useState<any>(null)
  const [now, setNow] = useState(Date.now())
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [tableDiv, setTableDiv] = useState<'Elitserien Herrar' | 'Elitserien Damer'>('Elitserien Herrar')
  const [standingsMap, setStandingsMap] = useState<Record<string, TableRow[]>>({})
  const [nextMatchHidden, setNextMatchHidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('nextMatchHidden') === '1'
  })
  const toggleNextMatch = () => setNextMatchHidden(prev => {
    const next = !prev
    if (typeof window !== 'undefined') localStorage.setItem('nextMatchHidden', next ? '1' : '0')
    return next
  })

  const toggleDate = (key: string) =>
    setExpandedDates(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  const LIMIT = 3

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
  }, [])

  useEffect(() => {
    if (DEMO) {
      setLive(MOCK_LIVE)
      setRecent(MOCK_RECENT)
      setUpcoming(MOCK_UPCOMING)
      setHonor(MOCK_HONOR)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)

    Promise.all([
      supabase.from('matches')
        .select('id,date,status,division,home_score,away_score,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .in('status', ['live', 'completed'])
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false })
        .limit(40),
      supabase.from('matches')
        .select('id,date,status,division,home_score,away_score,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .eq('status', 'upcoming')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(15),
      supabase.auth.getSession(),
    ]).then(async ([{ data: recentLive }, { data: upcomingData }, { data: { session: sess } }]) => {
      const all = (recentLive || []) as unknown as Match[]
      setLive(all.filter(m => m.status === 'live'))
      setRecent(all.filter(m => m.status === 'completed'))
      setUpcoming((upcomingData || []) as unknown as Match[])
      setSession(sess)

      const matchIds = all.map(m => m.id)
      if (matchIds.length > 0) {
        const { data: results } = await supabase
          .from('match_results')
          .select('games, player_id, match_id, player:players!player_id(id, name)')
          .in('match_id', matchIds)
          .not('player_id', 'is', null)

        const entries: HonorEntry[] = []
        const seen = new Set<string>()
        results?.forEach((r: any) => {
          const player = r.player
          if (!player) return
          const games: number[] = r.games || []
          const best = games.length > 0 ? Math.max(...games) : 0
          if (best >= 220) {
            const key = `${r.player_id}_${r.match_id}`
            if (!seen.has(key)) { seen.add(key); entries.push({ playerName: player.name, score: best, matchId: r.match_id }) }
          }
        })
        setHonor(entries.sort((a, b) => b.score - a.score).slice(0, 12))
      }

      if (sess) {
        const [{ data: favs }, { data: claim }] = await Promise.all([
          supabase.from('favorites').select('team_id').eq('user_id', sess.user.id).eq('type', 'team'),
          supabase.from('club_claims').select('team_id').eq('user_id', sess.user.id).single(),
        ])
        const ids = new Set<string>()
        favs?.forEach((f: any) => ids.add(f.team_id))
        if ((claim as any)?.team_id) ids.add((claim as any).team_id)
        setFollowedIds(ids)
      }

      // Fetch all completed matches for Elitserien standings
      const { data: eliteMatches } = await supabase
        .from('matches')
        .select('home_team_id,away_team_id,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .eq('status', 'completed')
        .in('division', ['Elitserien Herrar', 'Elitserien Damer'])
        .not('home_score', 'is', null)
      if (eliteMatches) {
        const sMap: Record<string, TableRow[]> = {}
        for (const div of ['Elitserien Herrar', 'Elitserien Damer'] as const) {
          sMap[div] = calcHomeStandings(eliteMatches as unknown as StandingsMatch[], div)
        }
        setStandingsMap(sMap)
      }

      setLoading(false)
    })
  }, [])

  if (loading) return <HomePageSkeleton />

  const filterByTab = (ms: Match[]) => {
    if (tab === 'alla' || followedIds.size === 0) return ms
    return ms.filter(m => {
      const homeId = (m.home as any)?.id
      const awayId = (m.away as any)?.id
      return (homeId && followedIds.has(homeId)) || (awayId && followedIds.has(awayId))
    })
  }

  const filteredLive     = filterByTab(live)
  const filteredRecent   = filterByTab(recent)
  const filteredUpcoming = filterByTab(upcoming)

  const UP_IN_STRIP = 3
  const liveItems: StripItem[] = [
    ...filteredLive.map(m => ({ kind: 'match' as const, match: m })),
    ...(DEMO ? [{ kind: 'tavling' as const, id: 'tav-gp-live', name: 'GP Final 2026',
      sub: 'Tourfinal – 6 deltävlingar bakom sig', dateLabel: '16–17 maj',
      venue: 'Sollentuna', href: '/tavlingar', isPagaende: true }] : []),
  ]
  const upcomingItems: StripItem[] = [
    ...filteredUpcoming.slice(0, UP_IN_STRIP).map(m => ({ kind: 'match' as const, match: m })),
    ...(DEMO ? [{ kind: 'tavling' as const, id: 'tav-gp', name: 'GP Final 2026',
      sub: 'Tourfinal – 6 deltävlingar bakom sig', dateLabel: '16–17 maj',
      venue: 'Sollentuna', href: '/tavlingar', isPagaende: false }] : []),
  ]
  const remainingUp = filteredUpcoming.slice(UP_IN_STRIP)

  const recentByDate   = group(filteredRecent)
  const recentDates    = Object.keys(recentByDate).sort((a, b) => b.localeCompare(a))
  const upcomingByDate = group(remainingUp)
  const upcomingDates  = Object.keys(upcomingByDate).sort()
  const isEmpty = filteredLive.length === 0 && filteredRecent.length === 0 && filteredUpcoming.length === 0

  const tableRows: TableRow[] = DEMO ? (MOCK_TABLES[tableDiv] ?? []) : (standingsMap[tableDiv] ?? [])
  const myNextMatch: Match | null = DEMO
    ? (filteredUpcoming[0] ?? null)
    : (session && followedIds.size > 0
        ? upcoming.find(m => {
            const hId = (m.home as any)?.id; const aId = (m.away as any)?.id
            return (hId && followedIds.has(hId)) || (aId && followedIds.has(aId))
          }) ?? null
        : null)

  const myPlayer = DEMO ? MOCK_MY_PLAYER : null

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <div className="mx-auto max-w-app pb-12">

        {DEMO && (
          <div className="flex items-center gap-1.5 border-b border-gold/20 bg-gold/10 px-4 py-1.5 dark:bg-gold/8">
            <span className="text-[9px] font-extrabold tracking-wide text-gold">DEMO</span>
            <span className="text-[9px] text-dark-muted">Mock-data — sätt DEMO = false för riktig data</span>
          </div>
        )}

        {followedIds.size > 0 && (
          <div className="flex border-b border-light-border px-4 dark:border-dark-border">
            {(['alla', 'foljer'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'cursor-pointer border-0 bg-transparent px-3.5 pt-2.5 pb-2 text-[11px] font-bold tracking-wide',
                  tab === t
                    ? 'border-b-2 border-gold text-gold'
                    : 'border-b-2 border-transparent text-dark-muted',
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {t === 'alla' ? 'ALLA' : 'FÖLJER'}
              </button>
            ))}
          </div>
        )}

        {myNextMatch && !nextMatchHidden && (
          <MyNextMatchCard
            match={myNextMatch}
            now={now}
            isMyHome={DEMO ? true : followedIds.has(myNextMatch.home.id)}
            homeForm={
              DEMO && myNextMatch.home.id === 'demo-t3'
                ? ['W', 'W', 'D', 'W', 'L']
                : DEMO && myNextMatch.home.id === 'demo-t4'
                  ? ['L', 'D', 'W', 'L', 'W']
                  : []
            }
            awayForm={
              DEMO && myNextMatch.away.id === 'demo-t3'
                ? ['W', 'W', 'D', 'W', 'L']
                : DEMO && myNextMatch.away.id === 'demo-t4'
                  ? ['L', 'D', 'W', 'L', 'W']
                  : []
            }
            onHide={toggleNextMatch}
          />
        )}

                {/* ── Hero strip ───────────────────────────────────────────────────────── */}
        {(liveItems.length > 0 || upcomingItems.length > 0) && (
          <HeroStrip liveItems={liveItems} upcomingItems={upcomingItems} now={now} />
        )}


        {filteredLive.length > 0 && (
          <MatchPulsen matches={filteredLive} followedIds={followedIds} />
        )}

        {/* ── Honor Roll ───────────────────────────────────────────────────────── */}
        <HonorRoll honor={honor} />

        {myPlayer && (
          <MyProfileCard
            name={myPlayer.name}
            team={myPlayer.team}
            division={myPlayer.division}
            average={myPlayer.average}
            lastScores={myPlayer.lastScores}
          />
        )}

        {myPlayer && (() => {
          const div = myPlayer.division
          const table = MOCK_TABLES[div] ?? []
          const zones = DIVISION_ZONES[div]
          if (!zones) return null
          const nextMatch = DEMO
            ? [...MOCK_UPCOMING].find(m => m.home.id === myPlayer.teamId || m.away.id === myPlayer.teamId)
            : null
          const opp = nextMatch
            ? (nextMatch.home.id === myPlayer.teamId ? nextMatch.away.name : nextMatch.home.name)
            : null
          return (
            <TeamZoneCard
              teamName={myPlayer.team}
              teamId={myPlayer.teamId}
              division={div}
              table={table}
              zones={zones}
              nextOpponentName={opp}
            />
          )
        })()}

        {/* ── Mini ligatabell ─────────────────────────────────────────── */}
        <MiniStandings
          tableRows={tableRows}
          tableDiv={tableDiv}
          setTableDiv={setTableDiv}
          followedIds={followedIds}
        />

        {/* ── Recent results ───────────────────────────────────────────────────── */}
        {recentDates.length > 0 && (
          <div className="px-4 pt-4">
            <div className="mb-2.5 text-[10px] font-extrabold tracking-widest text-dark-muted">
              SENASTE RESULTAT
            </div>
            {recentDates.map(date => (
              <MatchDateGroup
                key={date}
                date={date}
                matches={recentByDate[date]}
                now={now}
                isExpanded={expandedDates.has(date)}
                limit={LIMIT}
                onToggle={() => toggleDate(date)}
              />
            ))}
          </div>
        )}

        {/* ── Remaining upcoming ───────────────────────────────────────────────── */}
        {upcomingDates.length > 0 && (
          <div className="px-4 pt-4">
            <div className="mb-2.5 text-[10px] font-extrabold tracking-widest text-dark-muted">
              KOMMANDE MATCHER
            </div>
            {upcomingDates.map(date => {
              const key = `up-${date}`
              return (
                <MatchDateGroup
                  key={date}
                  date={date}
                  matches={upcomingByDate[date]}
                  now={now}
                  isExpanded={expandedDates.has(key)}
                  limit={LIMIT}
                  onToggle={() => toggleDate(key)}
                  squareDot
                />
              )
            })}
          </div>
        )}

        {/* ── SLLM promo ───────────────────────────────────────────────────────── */}
        <a
          href="/sllm"
          className="mx-4 mt-4 flex items-center gap-3 rounded-[14px] border border-gold/22 bg-gold/[0.08] px-4 py-3.5 no-underline dark:bg-gold/[0.07]"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-[9px] font-extrabold tracking-wide text-gold">
              KOMMANDE TURNERING
            </div>
            <div className="text-sm leading-tight font-extrabold bk-text-primary">
              Storm Lucky Larsen Masters
            </div>
            <div className="mt-[3px] text-[11px] text-dark-muted">
              22–30 aug · Lucky Bowl, Helsingborg
            </div>
          </div>
          <div className="shrink-0 text-[11px] font-bold text-gold">Mer info →</div>
        </a>

        {/* ── Din nästa match compact strip (when hidden) / Login CTA ──────────── */}
        {myNextMatch && nextMatchHidden && (
          <div
            className={cn(
              'mx-4 mt-4 flex items-center gap-2.5 rounded-xl border px-3 py-2.5',
              'border-[#5a82b4]/25 bg-[#5a82b4]/5 dark:border-[#5a82b4]/22 dark:bg-[#5a82b4]/6',
            )}
          >
            <button
              type="button"
              onClick={toggleNextMatch}
              className="flex h-[26px] w-[26px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[#5a82b4]/15 text-[13px] font-bold text-[#5a82b4] dark:bg-[#5a82b4]/22"
            >
              ↑
            </button>
            <a
              href={`/matches/${myNextMatch.id}`}
              className="flex min-w-0 flex-1 items-center gap-2 no-underline"
            >
              <span className="shrink-0 text-[9px] font-extrabold tracking-wide text-[#5a82b4]">
                DIN MATCH
              </span>
              <span className="min-w-0 truncate text-xs font-semibold bk-text-primary">
                {shortName(myNextMatch.home?.name || '')} – {shortName(myNextMatch.away?.name || '')}
              </span>
              <span className="ml-auto shrink-0 text-xs font-extrabold text-[#5a82b4] tabular-nums">
                {countdown(myNextMatch.date, now) ||
                  new Date(myNextMatch.date).toLocaleTimeString('sv-SE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
              </span>
            </a>
          </div>
        )}
        {!session && !DEMO && !isEmpty && (
          <div
            className={cn(
              'mx-4 mt-5 rounded-[14px] border px-4 py-4.5 text-center',
              'border-light-border bg-black/2 dark:border-dark-border dark:bg-white/2',
            )}
          >
            <div className="mb-1 text-[13px] font-bold bk-text-primary">Håll koll på ditt lag</div>
            <div className="mb-3.5 text-xs text-dark-muted">
              Logga in för att följa lag och få personlig feed
            </div>
            <a
              href="/login"
              className="inline-block rounded-lg bg-gold px-5 py-2 text-xs font-bold text-black no-underline"
            >
              Logga in →
            </a>
          </div>
        )}

        {isEmpty && (
          <div className="px-6 py-16 text-center">
            <div className="mb-2 text-[15px] font-bold bk-text-primary">
              {tab === 'foljer' ? 'Inga matcher för lag du följer' : 'Inga matcher just nu'}
            </div>
            <div className="mb-4 text-[13px] text-dark-muted">
              {tab === 'foljer'
                ? 'Följ fler lag för att se deras matcher här'
                : 'Kolla schemat för kommande omgångar'}
            </div>
            <a
              href={tab === 'foljer' ? '/teams' : '/schema'}
              className="text-xs font-bold text-gold no-underline"
            >
              {tab === 'foljer' ? 'Hitta lag →' : 'Se schema →'}
            </a>
          </div>
        )}

      </div>
    </main>
  )
}
