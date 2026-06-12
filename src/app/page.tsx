'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useColors } from '@/components/ThemeProvider'
import { APP_SPORT } from '@/lib/sport-config'

import type { Match, HonorEntry, TableRow, StandingsMatch } from './home/types'
import { group, calcHomeStandings } from './home/helpers'
import {
  MOCK_LIVE, MOCK_UPCOMING, MOCK_RECENT, MOCK_HONOR,
  MOCK_TABLES, MOCK_MY_PLAYER, DIVISION_ZONES,
} from './home/demoData'
import { useHomeMatches, useHonorRoll, useStandings, useSession } from '@/lib/queries'
import { createClient } from '@/lib/supabase'

import HomeSkeleton from '@/components/home/HomeSkeleton'
import AppGreeting from '@/components/home/AppGreeting'
import LiveHero from '@/components/home/LiveHero'
import HonorFeed from '@/components/home/HonorFeed'
import MiniStandings from '@/components/home/MiniStandings'
import MatchDateGroup from '@/components/home/MatchDateGroup'
import TeamNeeds from '@/components/home/TeamNeeds'

const DEMO = true

export default function Home() {
  const { C, isDark } = useColors()

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: session }                              = useSession()
  const { data: matchData, isLoading: matchesLoading } = useHomeMatches()
  const recentLiveRaw = (matchData?.recentLive ?? []) as unknown as Match[]
  const live          = recentLiveRaw.filter(m => m.status === 'live')
  const recent        = recentLiveRaw.filter(m => m.status === 'completed')
  const upcoming      = (matchData?.upcoming ?? []) as unknown as Match[]
  const { data: honorRaw = [] } = useHonorRoll(recentLiveRaw.map(m => m.id))
  const { data: eliteMatches = [], isLoading: standingsLoading } = useStandings()

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab, setTab]                     = useState<'alla' | 'foljer'>('alla')
  const [followedIds, setFollowedIds]     = useState<Set<string>>(new Set())
  const [now, setNow]                     = useState(Date.now())
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [tableDiv, setTableDiv]           = useState<'Elitserien Herrar' | 'Elitserien Damer'>('Elitserien Herrar')

  useEffect(() => {
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
      if ((claim as { team_id?: string } | null)?.team_id)
        ids.add((claim as { team_id: string }).team_id)
      setFollowedIds(ids)
    })
  }, [session?.user?.id])

  if (DEMO ? false : matchesLoading) return <HomeSkeleton C={C} isDark={isDark} />

  // ── Derived ───────────────────────────────────────────────────────────────
  const filterByTab = (ms: Match[]) => {
    if (tab === 'alla' || !followedIds.size) return ms
    return ms.filter(m => {
      const hId = (m.home as { id?: string })?.id
      const aId = (m.away as { id?: string })?.id
      return (hId && followedIds.has(hId)) || (aId && followedIds.has(aId))
    })
  }

  const filteredLive     = DEMO ? MOCK_LIVE     : filterByTab(live)
  const filteredRecent   = DEMO ? MOCK_RECENT   : filterByTab(recent)
  const filteredUpcoming = DEMO ? MOCK_UPCOMING : filterByTab(upcoming)
  const displayHonor     = DEMO ? MOCK_HONOR    : (honorRaw as HonorEntry[])
  const myPlayer         = DEMO ? MOCK_MY_PLAYER : null

  const standingsMap: Record<string, TableRow[]> = {}
  if (!standingsLoading) {
    for (const div of ['Elitserien Herrar', 'Elitserien Damer'] as const)
      standingsMap[div] = calcHomeStandings(eliteMatches as unknown as StandingsMatch[], div)
  }

  // Hero carousel: live matches first, then nearest upcoming
  const heroMatches: Match[] = [
    ...filteredLive,
    ...(filteredLive.length === 0 ? filteredUpcoming.slice(0, 3) : filteredUpcoming.slice(0, 1)),
  ]

  // Upcoming after the hero carousel
  const remainingUpcoming = filteredUpcoming.slice(filteredLive.length === 0 ? 3 : 1)

  const recentByDate   = group(filteredRecent)
  const recentDates    = Object.keys(recentByDate).sort((a, b) => b.localeCompare(a))
  const upcomingByDate = group(remainingUpcoming)
  const upcomingDates  = Object.keys(upcomingByDate).sort()

  const tableRows: TableRow[] = DEMO
    ? (MOCK_TABLES[tableDiv] ?? [])
    : (standingsMap[tableDiv] ?? [])

  const nextMatch = filteredUpcoming[0] ?? null
  const today     = new Date(now).toISOString().slice(0, 10)
  const isMatchDay = filteredLive.length > 0 || filteredUpcoming.some(m => m.date.startsWith(today))

  // User personalisation for greeting
  const firstName = myPlayer?.name?.split(' ')[0]
    ?? (session ? (session.user.email?.split('@')[0] ?? undefined) : undefined)
  const teamPosition = myPlayer?.teamRank ?? null
  const teamDivision = myPlayer?.division ?? null

  const toggleDate = (key: string) =>
    setExpandedDates(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>

        {DEMO && (
          <div style={{
            padding: '5px 20px',
            background: isDark ? 'rgba(245,194,0,0.07)' : 'rgba(245,194,0,0.10)',
            borderBottom: '1px solid rgba(245,194,0,0.18)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: '#f5c200', letterSpacing: 1.5 }}>DEMO</span>
            <span style={{ fontSize: 9, color: C.muted }}>Mock-data aktiv · sätt DEMO = false för live</span>
          </div>
        )}

        {/* ── Tab filter (only when following teams) ─────────────────────── */}
        {followedIds.size > 0 && (
          <div style={{ display: 'flex', padding: '0 20px', borderBottom: `1px solid ${C.border}` }}>
            {(['alla', 'foljer'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                fontSize: 11, fontWeight: 700,
                color: tab === t ? C.accent : C.muted,
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`,
                padding: '10px 14px 8px', cursor: 'pointer', letterSpacing: 0.5,
                WebkitTapHighlightColor: 'transparent',
              } as React.CSSProperties}>
                {t === 'alla' ? 'ALLA' : 'FÖLJER'}
              </button>
            ))}
          </div>
        )}

        {/* ── Greeting + hero metric (fills first viewport) ──────────────── */}
        <AppGreeting
          sport={APP_SPORT}
          now={now}
          liveCount={filteredLive.length}
          liveMatches={filteredLive}
          nextMatch={nextMatch}
          teamPosition={teamPosition}
          teamDivision={teamDivision}
          userName={firstName}
          isMatchDay={isMatchDay}
        />

        {/* ── Thin divider between greeting and feed ─────────────────────── */}
        <div style={{
          margin: '0 24px', height: 1,
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }} />

        {/* ── Live / upcoming hero carousel ──────────────────────────────── */}
        {heroMatches.length > 0 && (
          <div id="live">
            <LiveHero matches={heroMatches} now={now} />
          </div>
        )}

        {/* ── Honor roll ─────────────────────────────────────────────────── */}
        <HonorFeed honor={displayHonor} />

        {/* ── Team needs (only in demo / when personalised) ──────────────── */}
        {myPlayer && (
          <TeamNeeds
            myPlayer={myPlayer}
            tables={MOCK_TABLES}
            divisionZones={DIVISION_ZONES}
            upcoming={filteredUpcoming}
            C={C}
            isDark={isDark}
          />
        )}

        {/* ── Standings ──────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 32 }}>
          <MiniStandings
            tableRows={tableRows}
            tableDiv={tableDiv}
            setTableDiv={setTableDiv}
            followedIds={followedIds}
            C={C}
            isDark={isDark}
          />
        </div>

        {/* ── Recent results ─────────────────────────────────────────────── */}
        {recentDates.length > 0 && (
          <div style={{ padding: '32px 20px 0' }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 2,
              color: C.muted, marginBottom: 14,
            }}>SENASTE RESULTAT</div>
            {recentDates.map(date => (
              <MatchDateGroup key={date} date={date} matches={recentByDate[date]}
                expandKey={date} expandedDates={expandedDates} onToggle={toggleDate}
                isDot={true} C={C} isDark={isDark} now={now} />
            ))}
          </div>
        )}

        {/* ── Upcoming list ──────────────────────────────────────────────── */}
        {upcomingDates.length > 0 && (
          <div style={{ padding: '32px 20px 0' }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 2,
              color: C.muted, marginBottom: 14,
            }}>KOMMANDE MATCHER</div>
            {upcomingDates.map(date => (
              <MatchDateGroup key={date} date={date} matches={upcomingByDate[date]}
                expandKey={'up-' + date} expandedDates={expandedDates} onToggle={toggleDate}
                isDot={false} C={C} isDark={isDark} now={now} />
            ))}
          </div>
        )}

        {/* ── Tournament card ────────────────────────────────────────────── */}
        <Link href="/sllm" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          margin: '32px 20px 0', padding: '18px 20px',
          borderRadius: 18, textDecoration: 'none',
          background: isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.07)',
          border: '1px solid rgba(245,194,0,0.20)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: 'rgba(245,194,0,0.7)', marginBottom: 5 }}>
              KOMMANDE TÄVLING
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>
              Storm Lucky Larsen Masters
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              22–30 aug · Lucky Bowl, Helsingborg
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(245,194,0,0.75)', flexShrink: 0 }}>Mer info →</div>
        </Link>

        {/* ── Login nudge (unauthenticated, non-demo) ────────────────────── */}
        {!session && !DEMO && (
          <div style={{
            margin: '32px 20px 0', borderRadius: 18,
            border: `1px solid ${C.border}`,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Håll koll på ditt lag</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
              Logga in för att följa lag och få personlig feed
            </div>
            <Link href="/login" style={{
              display: 'inline-block', padding: '10px 28px',
              background: C.accent, color: '#000', borderRadius: 10,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>
              Logga in →
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}
