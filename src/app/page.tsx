'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName } from '@/lib/utils'

type Match = {
  id: string; date: string; status: string; division: string
  home_score: number | null; away_score: number | null
  home: { id: string; name: string }; away: { id: string; name: string }
}

function divColor(d: string) {
  if (d.includes('SM') || d.includes('slutspel')) return '#f5c200'
  if (d.includes('Damer')) return '#d94a90'
  if (d.includes('Elitserien')) return '#4a90d9'
  if (d.includes('Allsvenskan')) return '#5ba85a'
  return '#8a7a5a'
}

function shortDiv(d: string) {
  return d.replace(' Herrar', ' H').replace(' Damer', ' D')
    .replace('Mellanallsvenskan', 'Mellansv.').replace('Allsvenskan', 'Allsv.')
    .replace('Elitserien', 'Elit.').replace('Div 1 ', 'D1 ')
    .replace('Norra ', 'N.').replace('Södra ', 'S.')
}

function dateLabel(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return 'IDAG'
  if (dateStr === yesterday) return 'IGÅR'
  return new Date(dateStr + 'T12:00:00')
    .toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })
    .toUpperCase()
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

export default function Home() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [live, setLive] = useState<Match[]>([])
  const [recent, setRecent] = useState<Match[]>([])
  const [upcoming, setUpcoming] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    ]).then(([{ data: recentLive }, { data: upcomingData }]) => {
      const all = (recentLive || []) as unknown as Match[]
      setLive(all.filter(m => m.status === 'live'))
      setRecent(all.filter(m => m.status === 'completed'))
      setUpcoming((upcomingData || []) as unknown as Match[])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Laddar...</div>
    </main>
  )

  const recentByDate = group(recent)
  const recentDates = Object.keys(recentByDate).sort((a, b) => b.localeCompare(a))
  const upcomingByDate = group(upcoming)
  const upcomingDates = Object.keys(upcomingByDate).sort()
  const isEmpty = live.length === 0 && recent.length === 0 && upcoming.length === 0

  const MatchRow = ({ m }: { m: Match }) => {
    const dc = divColor(m.division)
    const hasScore = m.home_score !== null
    const homeWin = hasScore && m.home_score! > m.away_score!
    const awayWin = hasScore && m.away_score! > m.home_score!
    return (
      <a href={'/matches/' + m.id}
        style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, padding: '10px 8px', textDecoration: 'none', borderRadius: 8, alignItems: 'center', borderLeft: '3px solid ' + dc, margin: '2px 8px', WebkitTapHighlightColor: 'transparent' } as any}
        onMouseEnter={e => (e.currentTarget.style.background = C.card)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ fontSize: 14, fontWeight: homeWin ? 700 : 400, color: hasScore ? (homeWin ? C.text : C.textMuted) : C.text, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shortName(m.home?.name || '')}
        </div>
        <div style={{ textAlign: 'center', minWidth: 64 }}>
          {hasScore ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: homeWin ? C.accent : C.textMuted }}>{m.home_score}</span>
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 300 }}>–</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: awayWin ? C.accent : C.textMuted }}>{m.away_score}</span>
              </div>
              <div style={{ fontSize: 9, color: dc, fontWeight: 700, letterSpacing: 0.3, marginTop: 2 }}>{shortDiv(m.division)}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300 }}>vs</div>
              <div style={{ fontSize: 9, color: dc, fontWeight: 700, letterSpacing: 0.3, marginTop: 1 }}>{shortDiv(m.division)}</div>
            </>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: awayWin ? 700 : 400, color: hasScore ? (awayWin ? C.text : C.textMuted) : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shortName(m.away?.name || '')}
        </div>
      </a>
    )
  }

  const SectionHeader = ({ label, isLive = false }: { label: string; isLive?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 16px 6px', borderBottom: '1px solid ' + C.border }}>
      <div style={{ width: 8, height: 8, borderRadius: isLive ? '50%' : 2, background: isLive ? '#e05555' : C.accent, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: isLive ? '#e05555' : C.textMuted, letterSpacing: 1.5 }}>{label}</span>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

        {/* Live now */}
        {live.length > 0 && (
          <div>
            <SectionHeader label="LIVE NU" isLive />
            {live.map(m => <MatchRow key={m.id} m={m} />)}
          </div>
        )}

        {/* Recent results — newest date first */}
        {recentDates.map(date => (
          <div key={date}>
            <SectionHeader label={dateLabel(date)} />
            {recentByDate[date].map(m => <MatchRow key={m.id} m={m} />)}
          </div>
        ))}

        {/* Upcoming */}
        {upcomingDates.length > 0 && (
          <div>
            <SectionHeader label="KOMMANDE" />
            {upcomingDates.map(date => (
              <div key={date}>
                <div style={{ padding: '10px 16px 2px', fontSize: 11, fontWeight: 600, color: C.textMuted }}>
                  {dateLabel(date)}
                </div>
                {upcomingByDate[date].map(m => <MatchRow key={m.id} m={m} />)}
              </div>
            ))}
          </div>
        )}

        {isEmpty && (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Ingen aktivitet just nu
          </div>
        )}

      </div>
    </main>
  )
}
