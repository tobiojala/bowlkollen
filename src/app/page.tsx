'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
type Match = {
  id: string; date: string; status: string; division: string
  home_score: number | null; away_score: number | null
  home: { id: string; name: string }; away: { id: string; name: string }
}
type HonorEntry = { playerName: string; score: number; matchId: string }

// ── DEMO (set to false to use real Supabase data) ─────────────────────────────
const DEMO = true

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
    division: 'Elitserien Herrar', home_score: 5, away_score: 3,
    home: { id: 'demo-t1', name: 'IK Hakarpspojkarna' },
    away: { id: 'demo-t2', name: 'Mariestads BK' },
  },
]

const MOCK_UPCOMING: Match[] = [
  {
    id: 'demo-up-1', date: _in3h, status: 'upcoming', division: 'Allsvenskan Herrar',
    home_score: null, away_score: null,
    home: { id: 'demo-t3', name: 'Göteborgs BK' },
    away: { id: 'demo-t4', name: 'Linköpings BK' },
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
  { playerName: 'Marcus Lindgren', score: 279, matchId: 'demo-r-1' },
  { playerName: 'Sara Holmberg',   score: 256, matchId: 'demo-r-2' },
  { playerName: 'Jonas Persson',   score: 245, matchId: 'demo-r-3' },
  { playerName: 'Anna Karlsson',   score: 234, matchId: 'demo-r-4' },
  { playerName: 'Erik Svensson',   score: 224, matchId: 'demo-r-5' },
  { playerName: 'Lena Bergström',  score: 218, matchId: 'demo-r-6' },
  { playerName: 'Tobias Ek',       score: 209, matchId: 'demo-r-1' },
  { playerName: 'Maria Lund',      score: 204, matchId: 'demo-r-2' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const DAY_COLORS = ['#b06070', '#6080b8', '#8868b0', '#4a9e96', '#b07840', '#a85888', '#9e8840']
const dayDotColor = (dateStr: string) => DAY_COLORS[new Date(dateStr + 'T12:00:00').getDay()]

// ── Page ──────────────────────────────────────────────────────────────────────
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
  const [session, setSession] = useState<any>(null)
  const [now, setNow] = useState(Date.now())
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

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
          if (best >= 200) {
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

  const filteredLive     = filterByTab(live)
  const filteredRecent   = filterByTab(recent)
  const filteredUpcoming = filterByTab(upcoming)
  const nextUp           = filteredUpcoming[0] ?? null
  const remainingUp      = nextUp ? filteredUpcoming.slice(1) : filteredUpcoming

  const recentByDate   = group(filteredRecent)
  const recentDates    = Object.keys(recentByDate).sort((a, b) => b.localeCompare(a))
  const upcomingByDate = group(remainingUp)
  const upcomingDates  = Object.keys(upcomingByDate).sort()
  const isEmpty        = filteredLive.length === 0 && filteredRecent.length === 0 && filteredUpcoming.length === 0

  // ── Sub-components (defined inside render to access C, isDark, now) ──────────

  const SectionHeader = ({ label, isLive = false, count, date }: { label: string; isLive?: boolean; count?: number; date?: string }) => {
    const dotColor = isLive ? '#e05555' : date ? dayDotColor(date) : C.accent
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 16px 6px', borderBottom: '1px solid ' + C.border }}>
        <div style={{ width: 8, height: 8, borderRadius: isLive ? '50%' : 2, background: dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: isLive ? '#e05555' : C.textMuted, letterSpacing: 1.5 }}>{label}</span>
        {count !== undefined && count > 0 && (
          <span style={{ fontSize: 9, color: C.textMuted, fontWeight: 500 }}>· {count} matcher</span>
        )}
      </div>
    )
  }

  const MatchRow = ({ m }: { m: Match }) => {
    const dc = divColor(m.division)
    const hasScore = m.home_score !== null
    const homeWin  = hasScore && m.home_score! > m.away_score!
    const awayWin  = hasScore && m.away_score! > m.home_score!
    return (
      <a href={'/matches/' + m.id}
        style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, padding: '10px 8px',
          textDecoration: 'none', borderRadius: 8, alignItems: 'center',
          borderLeft: '3px solid ' + dc, margin: '2px 8px', WebkitTapHighlightColor: 'transparent' } as any}
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
            const cd      = countdown(m.date, now)
            const timeStr = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
            return (
              <>
                {cd
                  ? <div style={{ fontSize: 13, fontWeight: 800, color: C.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{cd}</div>
                  : <div style={{ fontSize: 11, color: C.textMuted }}>{timeStr || 'vs'}</div>
                }
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

  const LiveBanner = ({ m }: { m: Match }) => {
    const dc      = divColor(m.division)
    const homeWin = m.home_score! > m.away_score!
    const awayWin = m.away_score! > m.home_score!
    return (
      <a href={'/matches/' + m.id} style={{
        display: 'block', borderRadius: 16, textDecoration: 'none', overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(145deg, rgba(224,85,85,0.13) 0%, rgba(11,21,40,0.98) 100%)'
          : 'linear-gradient(145deg, rgba(224,85,85,0.07) 0%, rgba(248,248,252,1) 100%)',
        border: '1px solid rgba(224,85,85,0.3)',
        WebkitTapHighlightColor: 'transparent',
      } as any}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #e05555 0%, rgba(224,85,85,0.25) 100%)' }} />
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e05555',
                boxShadow: '0 0 6px #e05555' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#e05555', letterSpacing: 1.5 }}>LIVE</span>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: dc,
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3 }}>
              {shortDiv(m.division)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px 1fr', gap: 10, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.25,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName(m.home?.name || '')}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1,
                  color: homeWin ? C.accent : C.text }}>{m.home_score}</span>
                <span style={{ fontSize: 22, color: C.textMuted, fontWeight: 200, marginTop: -2 }}>–</span>
                <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1,
                  color: awayWin ? C.accent : C.text }}>{m.away_score}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.25,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName(m.away?.name || '')}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 10, fontWeight: 600,
            color: 'rgba(224,85,85,0.65)', letterSpacing: 0.3 }}>
            Tryck för detaljer →
          </div>
        </div>
      </a>
    )
  }

  const FeaturedMatchCard = ({ m }: { m: Match }) => {
    const dc      = divColor(m.division)
    const cd      = countdown(m.date, now)
    const dateStr = m.date.slice(0, 10)
    const time    = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    return (
      <a href={'/matches/' + m.id} style={{
        display: 'block', borderRadius: 16, textDecoration: 'none', overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(145deg, rgba(245,194,0,0.08) 0%, rgba(11,21,40,0.98) 100%)'
          : 'linear-gradient(145deg, rgba(245,194,0,0.06) 0%, rgba(248,248,252,1) 100%)',
        border: `1px solid ${isDark ? 'rgba(245,194,0,0.2)' : 'rgba(245,194,0,0.28)'}`,
        WebkitTapHighlightColor: 'transparent',
      } as any}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #f5c200 0%, rgba(245,194,0,0.2) 100%)' }} />
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>NÄSTA MATCH</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: dc,
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3 }}>
              {shortDiv(m.division)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px 1fr', gap: 10, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.25,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName(m.home?.name || '')}
              </div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>Hemma</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              {cd ? (
                <>
                  <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: C.accent,
                    fontVariantNumeric: 'tabular-nums' }}>{cd}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 5 }}>
                    {dateLabel(dateStr)} · {time}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.textMuted }}>{time || 'vs'}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{dateLabel(dateStr)}</div>
                </>
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.25,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName(m.away?.name || '')}
              </div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>Borta</div>
            </div>
          </div>
        </div>
      </a>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

        {/* DEMO badge */}
        {DEMO && (
          <div style={{ padding: '6px 16px', background: isDark ? 'rgba(245,194,0,0.08)' : 'rgba(245,194,0,0.12)',
            borderBottom: '1px solid rgba(245,194,0,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#f5c200', letterSpacing: 1 }}>DEMO</span>
            <span style={{ fontSize: 9, color: C.textMuted }}>Mock-data — sätt DEMO = false för riktig data</span>
          </div>
        )}

        {/* ALLA / FÖLJER tabs */}
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

        {/* ── Live banners ─────────────────────────────────────────────────────── */}
        {filteredLive.length > 0 && (
          <div style={{ padding: '12px 16px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredLive.map(m => <LiveBanner key={m.id} m={m} />)}
          </div>
        )}

        {/* ── Featured next match ──────────────────────────────────────────────── */}
        {nextUp && (
          <div style={{ padding: filteredLive.length > 0 ? '8px 16px 4px' : '12px 16px 4px' }}>
            <FeaturedMatchCard m={nextUp} />
          </div>
        )}

        {/* ── Honor Roll ───────────────────────────────────────────────────────── */}
        {honor.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 10px',
              borderBottom: '1px solid ' + C.border }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f5c200', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>HONOR ROLL</span>
              <span style={{ fontSize: 9, color: C.textMuted }}>· senaste 7 dagarna</span>
            </div>
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 10, padding: '12px 16px 16px' } as any}>
              {honor.map((e, i) => {
                const isElite = e.score >= 250
                const isGold  = e.score >= 220 && e.score < 250
                const isGood  = e.score >= 200 && e.score < 220
                const scoreColor = isElite ? '#ffffff' : isGold ? '#f5c200' : isGood ? '#4caf7d' : C.textMuted
                const scoreGlow  = isElite ? '0 0 10px rgba(0,240,255,0.4), 0 0 24px rgba(0,240,255,0.2)' : 'none'
                const cardBorder = isElite ? 'rgba(245,194,0,0.45)'
                                 : isGold  ? 'rgba(245,194,0,0.25)'
                                 : isGood  ? 'rgba(76,175,125,0.28)'
                                 : isDark  ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
                const nameParts = e.playerName.split(' ')
                const firstName = nameParts[0]
                const lastName  = nameParts.slice(1).join(' ')
                return (
                  <a key={i} href={'/matches/' + e.matchId}
                    style={{ flexShrink: 0, textDecoration: 'none',
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                      border: `1px solid ${cardBorder}`, borderRadius: 12,
                      padding: '12px 14px', textAlign: 'center', minWidth: 82,
                      boxShadow: isElite ? '0 0 18px rgba(245,194,0,0.10)' : 'none' }}>
                    <div style={{ fontSize: isElite ? 32 : isGold ? 29 : 26, fontWeight: 900,
                      color: scoreColor, lineHeight: 1, textShadow: scoreGlow }}>{e.score}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginTop: 7,
                      maxWidth: 78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                    <div style={{ fontSize: 10, color: C.textMuted,
                      maxWidth: 78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Recent results ───────────────────────────────────────────────────── */}
        {recentDates.map(date => {
          const all        = recentByDate[date]
          const isExpanded = expandedDates.has(date)
          const visible    = isExpanded ? all : all.slice(0, LIMIT)
          const hidden     = all.length - LIMIT
          return (
            <div key={date}>
              <SectionHeader label={dateLabel(date)} count={all.length} date={date} />
              {visible.map(m => <MatchRow key={m.id} m={m} />)}
              {hidden > 0 && (
                <button onClick={() => toggleDate(date)}
                  style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none',
                    borderTop: '1px solid ' + C.border, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                  {isExpanded ? <>&#8593; Visa färre</> : <>{`Visa alla ${all.length} matcher`} &#8595;</>}
                </button>
              )}
            </div>
          )
        })}

        {/* ── Remaining upcoming ───────────────────────────────────────────────── */}
        {upcomingDates.length > 0 && (
          <div>
            <SectionHeader label="KOMMANDE" count={remainingUp.length} />
            {upcomingDates.map(date => {
              const all        = upcomingByDate[date]
              const key        = 'up-' + date
              const isExpanded = expandedDates.has(key)
              const visible    = isExpanded ? all : all.slice(0, LIMIT)
              const hidden     = all.length - LIMIT
              return (
                <div key={date}>
                  <div style={{ padding: '10px 16px 2px', fontSize: 11, fontWeight: 600, color: C.textMuted }}>
                    {dateLabel(date)}
                  </div>
                  {visible.map(m => <MatchRow key={m.id} m={m} />)}
                  {hidden > 0 && (
                    <button onClick={() => toggleDate(key)}
                      style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none',
                        borderTop: '1px solid ' + C.border, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                      {isExpanded ? <>&#8593; Visa färre</> : <>{`Visa alla ${all.length} matcher`} &#8595;</>}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Login CTA for logged-out users ───────────────────────────────────── */}
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

        {/* ── Empty state ──────────────────────────────────────────────────────── */}
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
