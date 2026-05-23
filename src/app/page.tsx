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

type HonorEntry = { playerName: string; score: number; matchId: string }

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

function countdown(dateStr: string, now: number) {
  const ms = Math.max(0, new Date(dateStr).getTime() - now)
  if (ms === 0) return null
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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
  const isDark = theme === 'dark'
  const [live, setLive] = useState<Match[]>([])
  const [recent, setRecent] = useState<Match[]>([])
  const [upcoming, setUpcoming] = useState<Match[]>([])
  const [honor, setHonor] = useState<HonorEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'alla' | 'foljer'>('alla')
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
  }, [])

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
      supabase.auth.getSession(),
    ]).then(async ([{ data: recentLive }, { data: upcomingData }, { data: { session } }]) => {
      const all = (recentLive || []) as unknown as Match[]
      setLive(all.filter(m => m.status === 'live'))
      setRecent(all.filter(m => m.status === 'completed'))
      setUpcoming((upcomingData || []) as unknown as Match[])

      // Honor roll: best individual game >= 200 per player per match, last 7 days
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
          if (best >= 200) {
            const key = `${r.player_id}_${r.match_id}`
            if (!seen.has(key)) {
              seen.add(key)
              entries.push({ playerName: player.name, score: best, matchId: r.match_id })
            }
          }
        })

        setHonor(entries.sort((a, b) => b.score - a.score).slice(0, 12))
      }

      // Followed team IDs for logged-in users
      if (session) {
        const [{ data: favs }, { data: claim }] = await Promise.all([
          supabase.from('favorites').select('team_id').eq('user_id', session.user.id).eq('type', 'team'),
          supabase.from('club_claims').select('team_id').eq('user_id', session.user.id).single(),
        ])
        const ids = new Set<string>()
        favs?.forEach((f: any) => ids.add(f.team_id))
        if ((claim as any)?.team_id) ids.add((claim as any).team_id)
        setFollowedIds(ids)
      }

      setLoading(false)
    })
  }, [])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Laddar...</div>
    </main>
  )

  const filterByTab = (ms: Match[]) => {
    if (tab === 'alla' || followedIds.size === 0) return ms
    return ms.filter(m => {
      const homeId = (m.home as any)?.id
      const awayId = (m.away as any)?.id
      return (homeId && followedIds.has(homeId)) || (awayId && followedIds.has(awayId))
    })
  }

  const filteredLive = filterByTab(live)
  const filteredRecent = filterByTab(recent)
  const filteredUpcoming = filterByTab(upcoming)

  const recentByDate = group(filteredRecent)
  const recentDates = Object.keys(recentByDate).sort((a, b) => b.localeCompare(a))
  const upcomingByDate = group(filteredUpcoming)
  const upcomingDates = Object.keys(upcomingByDate).sort()
  const isEmpty = filteredLive.length === 0 && filteredRecent.length === 0 && filteredUpcoming.length === 0

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
          ) : (() => {
            const cd = m.date ? countdown(m.date, now) : null
            const timeStr = m.date ? new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : ''
            return (
              <>
                {cd ? (
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{cd}</div>
                ) : (
                  <div style={{ fontSize: 11, color: C.textMuted }}>{timeStr || 'vs'}</div>
                )}
                <div style={{ fontSize: 9, color: dc, fontWeight: 700, letterSpacing: 0.3, marginTop: 2 }}>{shortDiv(m.division)}</div>
              </>
            )
          })()}
        </div>
        <div style={{ fontSize: 14, fontWeight: awayWin ? 700 : 400, color: hasScore ? (awayWin ? C.text : C.textMuted) : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shortName(m.away?.name || '')}
        </div>
      </a>
    )
  }

  const SectionHeader = ({ label, isLive = false, count }: { label: string; isLive?: boolean; count?: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 16px 6px', borderBottom: '1px solid ' + C.border }}>
      <div style={{ width: 8, height: 8, borderRadius: isLive ? '50%' : 2, background: isLive ? '#e05555' : C.accent, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: isLive ? '#e05555' : C.textMuted, letterSpacing: 1.5 }}>{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{ fontSize: 9, color: C.textMuted, fontWeight: 500 }}>· {count} matcher</span>
      )}
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

        {/* FÖLJER / ALLA tabs — only visible when user has followed teams */}
        {followedIds.size > 0 && (
          <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid ' + C.border }}>
            {(['alla', 'foljer'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ fontSize: 11, fontWeight: 700, color: tab === t ? C.accent : C.textMuted, background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`, padding: '10px 14px 8px', cursor: 'pointer', letterSpacing: 0.5, WebkitTapHighlightColor: 'transparent' } as any}>
                {t === 'alla' ? 'ALLA' : 'FÖLJER'}
              </button>
            ))}
          </div>
        )}

        {/* Honor Roll strip */}
        {honor.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 8px', borderBottom: '1px solid ' + C.border }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f5c200', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>HONOR ROLL</span>
              <span style={{ fontSize: 9, color: C.textMuted }}>· senaste 7 dagarna</span>
            </div>
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 8, padding: '10px 16px 14px' } as any}>
              {honor.map((e, i) => {
                const isPerfect = e.score === 300
                const scoreColor = isPerfect ? '#f5c200' : e.score >= 270 ? C.green : C.accent
                const nameParts = e.playerName.split(' ')
                const firstName = nameParts[0]
                const lastName = nameParts.slice(1).join(' ')
                return (
                  <a key={i} href={'/matches/' + e.matchId}
                    style={{ flexShrink: 0, textDecoration: 'none', background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${isPerfect ? 'rgba(245,194,0,0.35)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 12, padding: '10px 12px', textAlign: 'center', minWidth: 74 }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{e.score}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.text, marginTop: 5, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                    <div style={{ fontSize: 9, color: C.textMuted, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
                    {isPerfect && <div style={{ fontSize: 7, fontWeight: 800, color: '#f5c200', letterSpacing: 1, marginTop: 3 }}>PERFECT</div>}
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Live now */}
        {filteredLive.length > 0 && (
          <div>
            <SectionHeader label="LIVE NU" isLive />
            {filteredLive.map(m => <MatchRow key={m.id} m={m} />)}
          </div>
        )}

        {/* Recent results — newest date first */}
        {recentDates.map(date => (
          <div key={date}>
            <SectionHeader label={dateLabel(date)} count={recentByDate[date].length} />
            {recentByDate[date].map(m => <MatchRow key={m.id} m={m} />)}
          </div>
        ))}

        {/* Upcoming */}
        {upcomingDates.length > 0 && (
          <div>
            <SectionHeader label="KOMMANDE" count={filteredUpcoming.length} />
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
            {tab === 'foljer' ? 'Inga matcher för lag du följer' : 'Ingen aktivitet just nu'}
          </div>
        )}

      </div>
    </main>
  )
}
