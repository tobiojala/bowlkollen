'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import type { Match, HonorEntry, TableRow, StandingsMatch } from './home/types'
import { calcHomeStandings } from './home/helpers'
import {
  MOCK_LIVE, MOCK_UPCOMING, MOCK_RECENT, MOCK_HONOR,
  MOCK_TABLES, MOCK_MY_PLAYER, DIVISION_ZONES,
} from './home/demoData'
import { useHomeMatches, useHonorRoll, useStandings, useSession } from '@/lib/queries'
import { createClient } from '@/lib/supabase'

import { HC } from './home/_components/tokens'
import HomeHero       from './home/_components/HomeHero'
import LiveCard       from './home/_components/LiveCard'
import MatchRow       from './home/_components/MatchRow'
import HonorList      from './home/_components/HonorList'
import StandingsCard  from './home/_components/StandingsCard'
import TournamentCard from './home/_components/TournamentCard'

const DEMO = true

const DAY_LABELS = [
  'Söndag', 'Ny vecka, ny chans', 'Laddar inför helgen', 'Mitt i veckan',
  'Nästan helg', 'Det händer snart', 'Helg',
] as const

type Div = 'Elitserien Herrar' | 'Elitserien Damer'

export default function Home() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: session }                              = useSession()
  const { data: matchData }                            = useHomeMatches()
  const recentLiveRaw = (matchData?.recentLive ?? []) as unknown as Match[]
  const liveReal      = recentLiveRaw.filter(m => m.status === 'live')
  const recentReal    = recentLiveRaw.filter(m => m.status === 'completed')
  const upcomingReal  = (matchData?.upcoming ?? []) as unknown as Match[]
  const { data: honorRaw = [] }                                  = useHonorRoll(recentLiveRaw.map(m => m.id))
  const { data: eliteMatches = [], isLoading: standingsLoading } = useStandings()

  // ── UI state ──────────────────────────────────────────────────────────────
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [now, setNow]                 = useState(0)   // set on mount — keeps render pure + SSR-stable
  const [tableDiv, setTableDiv]       = useState<Div>('Elitserien Herrar')

  useEffect(() => {
    // Client-only clock: seed real time on mount, then tick every second.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now())
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
  }, [])

  useEffect(() => {
    if (!session) return
    const supabase = createClient()
    Promise.all([
      supabase.from('favorites').select('team_id').eq('user_id', session.user.id).eq('type', 'team'),
      supabase.from('club_claims').select('team_id').eq('user_id', session.user.id).single(),
    ]).then(([{ data: favs }, { data: claim }]) => {
      const ids = new Set<string>()
      favs?.forEach((f: { team_id: string }) => ids.add(f.team_id))
      const cid = (claim as { team_id?: string } | null)?.team_id
      if (cid) ids.add(cid)
      setFollowedIds(ids)
    })
    // Re-run only when the signed-in user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  // ── Derived ───────────────────────────────────────────────────────────────
  const live     = DEMO ? MOCK_LIVE     : liveReal
  const recent   = DEMO ? MOCK_RECENT   : recentReal
  const upcoming = DEMO ? MOCK_UPCOMING : upcomingReal
  const honor    = DEMO ? MOCK_HONOR    : (honorRaw as HonorEntry[])
  const myPlayer = DEMO ? MOCK_MY_PLAYER : null

  const recentSorted   = [...recent].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const upcomingSorted = [...upcoming].sort((a, b) => a.date.localeCompare(b.date))
  const nextMatch      = upcomingSorted[0] ?? null
  const upcomingList   = upcomingSorted.slice(0, 6)

  const tableRows: TableRow[] = DEMO
    ? (MOCK_TABLES[tableDiv] ?? [])
    : (standingsLoading ? [] : calcHomeStandings(eliteMatches as unknown as StandingsMatch[], tableDiv))

  const today      = new Date(now).toISOString().slice(0, 10)
  const isMatchDay = live.length > 0 || upcoming.some(m => m.date.startsWith(today))
  const dayLine    = isMatchDay ? 'Matchdag' : DAY_LABELS[new Date(now).getDay()]
  const firstName  = myPlayer?.name?.split(' ')[0]
    ?? (session ? session.user.email?.split('@')[0] : undefined)

  const scrollToLive = () => document.getElementById('live')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <main style={{ minHeight: '100vh', background: HC.BG, color: HC.INK }}>
      <style>{`
        @keyframes count-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .hero-in { animation: count-in 0.3s cubic-bezier(0.25,0.46,0.45,0.94); }
        @keyframes live-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.82); } }
        .live-dot { animation: live-pulse 1.4s ease-in-out infinite; }
      `}</style>

      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>

        {DEMO && (
          <div style={{ padding: '5px 20px', background: 'rgba(245,194,0,0.07)',
            borderBottom: '1px solid rgba(245,194,0,0.18)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: HC.GOLD, letterSpacing: 1.5 }}>DEMO</span>
            <span style={{ fontSize: 9, color: HC.INK3 }}>Mock-data aktiv · sätt DEMO = false för live</span>
          </div>
        )}

        {/* Greeting + hero */}
        <HomeHero
          now={now}
          userName={firstName}
          dayLine={dayLine}
          liveCount={live.length}
          nextMatch={nextMatch}
          onTapLive={scrollToLive}
        />

        {/* Live matches */}
        {live.length > 0 && (
          <div id="live" style={{ padding: '12px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: HC.INK3, marginBottom: 12 }}>
              PÅGÅR NU
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {live.map(m => <LiveCard key={m.id} m={m} />)}
            </div>
          </div>
        )}

        {/* Honor roll */}
        <HonorList honor={honor} />

        {/* Standings */}
        <StandingsCard
          rows={tableRows}
          div={tableDiv}
          setDiv={setTableDiv}
          zone={DIVISION_ZONES[tableDiv]}
          followedIds={followedIds}
        />

        {/* Recent results */}
        {recentSorted.length > 0 && (
          <div style={{ padding: '32px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: HC.INK3, marginBottom: 12 }}>
              SENASTE RESULTAT
            </div>
            {recentSorted.map(m => <MatchRow key={m.id} m={m} variant="recent" now={now} />)}
          </div>
        )}

        {/* Upcoming */}
        {upcomingList.length > 0 && (
          <div style={{ padding: '32px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: HC.INK3, marginBottom: 12 }}>
              KOMMANDE MATCHER
            </div>
            {upcomingList.map(m => <MatchRow key={m.id} m={m} variant="upcoming" now={now} />)}
          </div>
        )}

        {/* Tournament teaser */}
        <TournamentCard />

        {/* Login nudge (unauthenticated, live data only) */}
        {!session && !DEMO && (
          <div style={{ margin: '32px 20px 0', borderRadius: 18, background: HC.SURFACE, padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: HC.INK, marginBottom: 6 }}>Håll koll på ditt lag</div>
            <div style={{ fontSize: 13, color: HC.INK3, marginBottom: 18 }}>Logga in för att följa lag och få personlig feed</div>
            <Link href="/login" style={{ display: 'inline-block', padding: '10px 28px', background: HC.GOLD,
              color: HC.BG, borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Logga in →
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}
