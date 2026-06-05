'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName } from '@/lib/utils'

import type { Match, HonorEntry, TableRow, StandingsMatch } from './home/types'
import { group, countdown, calcHomeStandings } from './home/helpers'
import { MOCK_LIVE, MOCK_UPCOMING, MOCK_RECENT, MOCK_HONOR, MOCK_TABLES, MOCK_MY_PLAYER, DIVISION_ZONES } from './home/demoData'
import { useHomeMatches, useHonorRoll, useStandings, useSession } from '@/lib/queries'

import HomeSkeleton from '@/components/home/HomeSkeleton'
import HeroStrip, { type StripItem } from '@/components/home/HeroStrip'
import NextMatchCard from '@/components/home/NextMatchCard'
import MatchPulsen from '@/components/home/MatchPulsen'
import MyProfile from '@/components/home/MyProfile'
import TeamNeeds from '@/components/home/TeamNeeds'
import MatchDateGroup from '@/components/home/MatchDateGroup'
import HonorRoll from '@/components/home/HonorRoll'
import MiniStandings from '@/components/home/MiniStandings'
import { createClient } from '@/lib/supabase'

const DEMO = false

export default function Home() {
  const { theme } = useTheme()
  const C      = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  // ── React Query data ───────────────────────────────────────────────────────
  const { data: session }                        = useSession()
  const { data: matchData, isLoading: matchesLoading } = useHomeMatches()
  const recentLiveRaw = (matchData?.recentLive ?? []) as unknown as Match[]
  const live   = recentLiveRaw.filter(m => m.status === 'live')
  const recent = recentLiveRaw.filter(m => m.status === 'completed')
  const upcoming = (matchData?.upcoming ?? []) as unknown as Match[]
  const matchIds = recentLiveRaw.map(m => m.id)

  const { data: honorRaw = [], isLoading: honorLoading } = useHonorRoll(matchIds)
  const honor = honorRaw as HonorEntry[]

  const { data: eliteMatches = [], isLoading: standingsLoading } = useStandings()

  const loading = DEMO ? false : matchesLoading

  // ── UI state ───────────────────────────────────────────────────────────────
  const [tab, setTab]                     = useState<'alla' | 'foljer'>('alla')
  const [followedIds, setFollowedIds]     = useState<Set<string>>(new Set())
  const [now, setNow]                     = useState(Date.now())
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [tableDiv, setTableDiv]           = useState<'Elitserien Herrar' | 'Elitserien Damer'>('Elitserien Herrar')
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

  // Clock tick
  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
  }, [])

  // Load followed teams when session arrives
  useEffect(() => {
    if (!session) return
    const supabase = createClient()
    Promise.all([
      supabase.from('favorites').select('team_id').eq('user_id', session.user.id).eq('type', 'team'),
      supabase.from('club_claims').select('team_id').eq('user_id', session.user.id).single(),
    ]).then(([{ data: favs }, { data: claim }]) => {
      const ids = new Set<string>()
      favs?.forEach((f: any) => ids.add(f.team_id))
      if ((claim as any)?.team_id) ids.add((claim as any).team_id)
      setFollowedIds(ids)
    })
  }, [session?.user?.id])

  if (loading) return <HomeSkeleton C={C} isDark={isDark} />

  // ── Derived data ───────────────────────────────────────────────────────────
  const standingsMap: Record<string, TableRow[]> = {}
  if (!standingsLoading) {
    for (const div of ['Elitserien Herrar', 'Elitserien Damer'] as const) {
      standingsMap[div] = calcHomeStandings(eliteMatches as unknown as StandingsMatch[], div)
    }
  }

  const filterByTab = (ms: Match[]) => {
    if (tab === 'alla' || followedIds.size === 0) return ms
    return ms.filter(m => {
      const homeId = (m.home as any)?.id
      const awayId = (m.away as any)?.id
      return (homeId && followedIds.has(homeId)) || (awayId && followedIds.has(awayId))
    })
  }

  const filteredLive     = DEMO ? MOCK_LIVE     : filterByTab(live)
  const filteredRecent   = DEMO ? MOCK_RECENT   : filterByTab(recent)
  const filteredUpcoming = DEMO ? MOCK_UPCOMING : filterByTab(upcoming)
  const displayHonor     = DEMO ? MOCK_HONOR    : honor

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
  const remainingUp    = filteredUpcoming.slice(UP_IN_STRIP)
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

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

        {DEMO && (
          <div style={{ padding: '6px 16px', background: isDark ? 'rgba(245,194,0,0.08)' : 'rgba(245,194,0,0.12)',
            borderBottom: '1px solid rgba(245,194,0,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#f5c200', letterSpacing: 1 }}>DEMO</span>
            <span style={{ fontSize: 9, color: C.textMuted }}>Mock-data — sätt DEMO = false för riktig data</span>
          </div>
        )}

        {followedIds.size > 0 && (
          <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid ' + C.border }}>
            {(['alla', 'foljer'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ fontSize: 11, fontWeight: 700, color: tab === t ? C.accent : C.textMuted,
                  background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`,
                  padding: '10px 14px 8px', cursor: 'pointer', letterSpacing: 0.5,
                  WebkitTapHighlightColor: 'transparent' } as any}>
                {t === 'alla' ? 'ALLA' : 'FÖLJER'}
              </button>
            ))}
          </div>
        )}

        {myNextMatch && !nextMatchHidden && (
          <NextMatchCard m={myNextMatch} C={C} isDark={isDark} isDemo={DEMO}
            followedIds={followedIds} now={now} onHide={toggleNextMatch} />
        )}

        {(liveItems.length > 0 || upcomingItems.length > 0) && (
          <HeroStrip liveItems={liveItems} upcomingItems={upcomingItems} C={C} isDark={isDark} now={now} />
        )}

        <MatchPulsen filteredLive={filteredLive} followedIds={followedIds} C={C} isDark={isDark} />

        <HonorRoll honor={displayHonor} C={C} isDark={isDark} />

        {myPlayer && <MyProfile myPlayer={myPlayer} C={C} isDark={isDark} />}

        {myPlayer && (
          <TeamNeeds myPlayer={myPlayer} tables={MOCK_TABLES} divisionZones={DIVISION_ZONES}
            upcoming={filteredUpcoming} C={C} isDark={isDark} />
        )}

        <MiniStandings tableRows={tableRows} tableDiv={tableDiv} setTableDiv={setTableDiv}
          followedIds={followedIds} C={C} isDark={isDark} />

        {recentDates.length > 0 && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, marginBottom: 10 }}>
              SENASTE RESULTAT
            </div>
            {recentDates.map(date => (
              <MatchDateGroup key={date} date={date} matches={recentByDate[date]}
                expandKey={date} expandedDates={expandedDates} onToggle={toggleDate}
                isDot={true} C={C} isDark={isDark} now={now} />
            ))}
          </div>
        )}

        {upcomingDates.length > 0 && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, marginBottom: 10 }}>
              KOMMANDE MATCHER
            </div>
            {upcomingDates.map(date => (
              <MatchDateGroup key={date} date={date} matches={upcomingByDate[date]}
                expandKey={'up-' + date} expandedDates={expandedDates} onToggle={toggleDate}
                isDot={false} C={C} isDark={isDark} now={now} />
            ))}
          </div>
        )}

        <a href="/sllm" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '16px 16px 0', padding: '14px 16px',
          borderRadius: 14, textDecoration: 'none',
          background: isDark ? 'rgba(245,194,0,0.07)' : 'rgba(245,194,0,0.08)',
          border: '1px solid rgba(245,194,0,0.22)',
        } as any}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#f5c200', letterSpacing: 1.4, marginBottom: 4 }}>KOMMANDE TURNERING</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>Storm Lucky Larsen Masters</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>22–30 aug · Lucky Bowl, Helsingborg</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f5c200', flexShrink: 0 }}>Mer info →</div>
        </a>

        {myNextMatch && nextMatchHidden && (
          <div style={{ margin: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12,
            border: `1px solid ${isDark ? 'rgba(91,130,180,0.22)' : 'rgba(91,130,180,0.28)'}`,
            background: isDark ? 'rgba(91,130,180,0.06)' : 'rgba(91,130,180,0.05)' }}>
            <button onClick={toggleNextMatch}
              style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', border: 'none',
                cursor: 'pointer', background: isDark ? 'rgba(91,130,180,0.22)' : 'rgba(91,130,180,0.14)',
                color: '#5a82b4', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                WebkitTapHighlightColor: 'transparent' } as any}>↑</button>
            <a href={'/matches/' + myNextMatch.id}
              style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
                textDecoration: 'none', WebkitTapHighlightColor: 'transparent' } as any}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#5a82b4', letterSpacing: 1.1, flexShrink: 0 }}>DIN MATCH</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName(myNextMatch.home?.name || '')} – {shortName(myNextMatch.away?.name || '')}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#5a82b4',
                fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {countdown(myNextMatch.date, now)
                  || new Date(myNextMatch.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </a>
          </div>
        )}

        {!session && !DEMO && !isEmpty && (
          <div style={{ margin: '20px 16px 0', borderRadius: 14,
            border: '1px solid ' + C.border,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            padding: '18px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>Håll koll på ditt lag</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>
              Logga in för att följa lag och få personlig feed
            </div>
            <a href="/login" style={{ display: 'inline-block', padding: '8px 22px',
              background: C.accent, color: '#000', borderRadius: 8,
              fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              Logga in →
            </a>
          </div>
        )}

        {isEmpty && (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              {tab === 'foljer' ? 'Inga matcher för lag du följer' : 'Inga matcher just nu'}
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
              {tab === 'foljer' ? 'Följ fler lag för att se deras matcher här' : 'Kolla schemat för kommande omgångar'}
            </div>
            <a href={tab === 'foljer' ? '/teams' : '/schema'}
              style={{ fontSize: 12, fontWeight: 700, color: C.accent, textDecoration: 'none' }}>
              {tab === 'foljer' ? 'Hitta lag →' : 'Se schema →'}
            </a>
          </div>
        )}

      </div>
    </main>
  )
}
