'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName } from '@/lib/utils'

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

const DAY_COLORS = ['#7a7898', '#4e72a0', '#5a82b4', '#3d9490', '#b88830', '#a06840', '#7060a8']
const dayDotColor = (dateStr: string) => DAY_COLORS[new Date(dateStr + 'T12:00:00').getDay()]

function tensionScore(m: Match): number {
  if (m.home_score === null) return 0
  const h = m.home_score, a = m.away_score!
  const diff = Math.abs(h - a)
  const total = h + a
  if (total === 0) return 0
  const closeness = 1 - diff / Math.max(total, 1)
  const progress = Math.min((m.gameNumber ?? 1) / (m.totalGames ?? 4), 1)
  return closeness * (0.6 + 0.4 * progress)
}

function tensionInsight(m: Match): string {
  if (m.home_score === null) return ''
  const h = m.home_score, a = m.away_score!
  const diff = Math.abs(h - a)
  const gn = m.gameNumber ?? 1
  const tg = m.totalGames ?? 4
  const remaining = tg - gn
  const isTied = h === a
  if (isTied && remaining <= 0) return 'Oavgjort · Slutspelet avgör'
  if (isTied && remaining === 1) return 'Kvitterat · Avgörande spelet'
  if (isTied) return `Kvitterat · Spel ${gn} av ${tg}`
  if (remaining <= 0) return `${diff} poäng isär · Slutspelet`
  if (remaining === 1 && diff <= 2) return `${diff} poäng · Avgörande spelet!`
  if (remaining === 1) return `${diff} poäng · Sista spelet`
  return `${diff} poäng isär · Spel ${gn} av ${tg}`
}

function tensionColor(score: number, muted: string): string {
  if (score > 0.85) return '#f5c200'
  if (score > 0.6) return '#38a088'
  return muted
}

function streamStyle(url: string): { label: string; color: string; bg: string; border: string } {
  const u = url.toLowerCase()
  if (u.includes('youtube') || u.includes('youtu.be'))
    return { label: '▶ YouTube', color: '#ff4040', bg: 'rgba(255,60,60,0.12)', border: 'rgba(255,60,60,0.3)' }
  if (u.includes('svtplay') || u.includes('svt.se'))
    return { label: '▶ SVT Play', color: '#5ab0e8', bg: 'rgba(90,176,232,0.12)', border: 'rgba(90,176,232,0.3)' }
  if (u.includes('svenskbowling') || u.includes('sb.tv'))
    return { label: '▶ Svensk Bowling TV', color: '#f5c200', bg: 'rgba(245,194,0,0.12)', border: 'rgba(245,194,0,0.3)' }
  return { label: '▶ Livestream', color: '#e05555', bg: 'rgba(224,85,85,0.12)', border: 'rgba(224,85,85,0.3)' }
}


const MOCK_MY_PLAYER = {
  name: 'Marcus Lindgren',
  team: 'Göteborgs BK',
  division: 'Allsvenskan Herrar',
  average: 194,
  lastScores: [178, 189, 234, 201, 212],
  teamRank: 6,
}
// ── HeroStrip types & component ───────────────────────────────────────────────
// Must live outside Home so React doesn't remount it on every second tick

type StripMatch = { kind: 'match'; match: Match }
type StripTav   = {
  kind: 'tavling'; id: string; name: string; sub: string
  dateLabel: string; venue: string; href: string; isPagaende: boolean
}
type StripItem = StripMatch | StripTav

const SPRING = { type: 'spring', stiffness: 320, damping: 30 } as const

function HeroStrip({ liveItems, upcomingItems, C, isDark, now }: {
  liveItems: StripItem[]; upcomingItems: StripItem[]
  C: typeof dark; isDark: boolean; now: number
}) {
  const hasLive = liveItems.length > 0
  const hasUp   = upcomingItems.length > 0
  const [mode, setMode]       = useState<'live' | 'upcoming'>(hasLive ? 'live' : 'upcoming')
  const [activeIdx, setActiveIdx] = useState(0)

  const items   = mode === 'live' ? liveItems : upcomingItems
  const safeIdx = Math.min(activeIdx, Math.max(0, items.length - 1))
  const item    = items[safeIdx]

  const switchMode = (m: 'live' | 'upcoming') => { setMode(m); setActiveIdx(0) }

  if (!item) return null

  return (
    <div style={{ paddingBottom: 4 }}>

      {/* ─── Mode toggle pill ─── */}
      {hasLive && hasUp && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
          {([['live', 'PÅGÅENDE', liveItems.length], ['upcoming', 'KOMMANDE', upcomingItems.length]] as const).map(([m, label, count]) => {
            const isAct = mode === m
            const clr   = m === 'live' ? '#f5c200' : '#5a82b4'
            return (
              <button key={m} onClick={() => switchMode(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', border: 'none',
                  background: isAct
                    ? (isDark ? `rgba(${m === 'live' ? '245,194,0' : '91,130,180'},0.15)` : `rgba(${m === 'live' ? '245,194,0' : '91,130,180'},0.1)`)
                    : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  outline: `1px solid ${isAct ? clr + '66' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                  WebkitTapHighlightColor: 'transparent',
                } as any}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
                  color: isAct ? clr : C.textMuted }}>
                  {label}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700,
                  color: isAct ? clr : C.textMuted,
                  background: isAct ? `rgba(${m === 'live' ? '245,194,0' : '91,130,180'},0.18)` : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                  borderRadius: 8, padding: '1px 6px' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}


      {/* ─── Hero card ─── */}
      <div style={{ padding: '12px 16px 0' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${safeIdx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {item.kind === 'match' ? (() => {
              const m        = item.match
              const isLive   = mode === 'live'
              const dc       = divColor(m.division)
              const hasScore = m.home_score !== null
              const homeWin  = hasScore && m.home_score! > m.away_score!
              const awayWin  = hasScore && m.away_score! > m.home_score!
              const cd       = !hasScore ? countdown(m.date, now) : null
              const time     = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              const dateStr  = m.date.slice(0, 10)
              const GREEN_M   = '#f5c200'
              const streams   = isLive ? (m.streams ?? []) : []
              const isStream  = streams.length > 0
              const topClr    = isLive ? GREEN_M : '#5a82b4'
              const bgFrom    = isLive
                ? (isDark ? 'rgba(245,194,0,0.1)' : 'rgba(245,194,0,0.06)')
                : (isDark ? 'rgba(91,130,180,0.1)' : 'rgba(91,130,180,0.06)')
              const edgeClr   = isLive
                ? (isDark ? 'rgba(245,194,0,0.3)' : 'rgba(245,194,0,0.35)')
                : (isDark ? 'rgba(91,130,180,0.25)' : 'rgba(91,130,180,0.3)')
              return (
                <a href={'/matches/' + m.id} style={{
                  display: 'block', borderRadius: 16, textDecoration: 'none', overflow: 'hidden',
                  background: isDark
                    ? `linear-gradient(145deg,${bgFrom} 0%,rgba(11,21,40,0.98) 100%)`
                    : `linear-gradient(145deg,${bgFrom} 0%,rgba(248,248,252,1) 100%)`,
                  border: `1px solid ${edgeClr}`,
                  WebkitTapHighlightColor: 'transparent',
                } as any}>
                  <div style={{ height: 3, background: `linear-gradient(90deg,${topClr},${topClr}40)` }} />
                  <div style={{ padding: '14px 16px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      {isLive ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN_M, boxShadow: `0 0 6px ${GREEN_M}` }} />
                            <span style={{ fontSize: 10, fontWeight: 800, color: GREEN_M, letterSpacing: 1.5 }}>PÅGÅENDE</span>
                          </div>
                          {isStream && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <motion.div
                                animate={{ opacity: [1, 0.2, 1], boxShadow: ['0 0 3px #e05555', '0 0 9px #e05555', '0 0 3px #e05555'] }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: '#e05555' }}
                              />
                              <span style={{ fontSize: 9, fontWeight: 800, color: '#e05555', letterSpacing: 1.2 }}>LIVE</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#5a82b4', letterSpacing: 1.5 }}>KOMMANDE</span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: dc,
                        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                        padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3 }}>
                        {shortDiv(m.division)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: hasScore ? (homeWin ? C.text : C.textMuted) : C.text }}>
                          {shortName(m.home?.name || '')}
                        </div>
                        <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>Hemma</div>
                      </div>

                      <div style={{ flexShrink: 0, width: 88, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {hasScore ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: homeWin ? C.accent : C.textMuted }}>{m.home_score}</span>
                            <span style={{ fontSize: 22, color: C.textMuted, fontWeight: 200, marginTop: -2 }}>–</span>
                            <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: awayWin ? C.accent : C.textMuted }}>{m.away_score}</span>
                          </div>
                        ) : cd ? (
                          <>
                            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: C.accent, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>{cd}</div>
                            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 1.5 }}>
                              {dateLabel(dateStr)}<br />{time}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, textAlign: 'center' }}>{time || 'vs'}</div>
                            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, textAlign: 'center' }}>{dateLabel(dateStr)}</div>
                          </>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: hasScore ? (awayWin ? C.text : C.textMuted) : C.text }}>
                          {shortName(m.away?.name || '')}
                        </div>
                        <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>Borta</div>
                      </div>
                    </div>

                    {isStream ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 14 }}>
                        {streams.map((s, idx) => {
                          const ss = streamStyle(s.url)
                          return (
                            <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: 10, fontWeight: 700, color: ss.color,
                                background: ss.bg, border: `1px solid ${ss.border}`,
                                borderRadius: 8, padding: '5px 10px', textDecoration: 'none',
                                display: 'flex', alignItems: 'center', gap: 5,
                                WebkitTapHighlightColor: 'transparent' } as any}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color, flexShrink: 0, display: 'inline-block' }} />
                              {ss.label}
                            </a>
                          )
                        })}
                      </div>
                    ) : isLive ? (
                      <div style={{ marginTop: 14, textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, color: `rgba(245,194,0,0.6)` }}>Tryck för detaljer →</span>
                      </div>
                    ) : null}
                  </div>
                </a>
              )
            })() : (
              // ─── Tävling hero — always gold ───
              <a href={item.href} style={{
                display: 'block', borderRadius: 16, textDecoration: 'none', overflow: 'hidden',
                background: isDark
                  ? 'linear-gradient(145deg,rgba(245,194,0,0.1) 0%,rgba(11,21,40,0.98) 100%)'
                  : 'linear-gradient(145deg,rgba(245,194,0,0.07) 0%,rgba(248,248,252,1) 100%)',
                border: `1px solid ${isDark ? 'rgba(245,194,0,0.25)' : 'rgba(245,194,0,0.32)'}`,
                WebkitTapHighlightColor: 'transparent',
              } as any}>
                <div style={{ height: 3, background: 'linear-gradient(90deg,#f5c200,rgba(245,194,0,0.2))' }} />
                <div style={{ padding: '14px 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 14, color: '#f5c200', lineHeight: 1 }}>◆</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>
                      {item.isPagaende ? 'TÄVLING PÅGÅR' : 'KOMMANDE TÄVLING'}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 6 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{item.sub}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 16 }}>{item.dateLabel} · {item.venue}</div>
                  <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#1a1400',
                    background: '#f5c200', borderRadius: 8, padding: '6px 16px' }}>
                    {item.isPagaende ? 'Se tävlingen →' : 'Mer info →'}
                  </div>
                </div>
              </a>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Compact strip ─── */}
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', padding: '10px 16px 6px' } as any}>
          {items.map((it, i) => {
            const isAct = i === safeIdx
            if (it.kind === 'match') {
              const m        = it.match
              const dc       = divColor(m.division)
              const hasScore = m.home_score !== null
              const homeWin  = hasScore && m.home_score! > m.away_score!
              const awayWin  = hasScore && m.away_score! > m.home_score!
              const isLiveM   = m.status === 'live'
              const isStreamM = isLiveM && (m.streams?.length ?? 0) > 0
              const GREEN_S   = '#f5c200'
              const cd        = !hasScore ? countdown(m.date, now) : null
              const time      = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              return (
                <button key={m.id} onClick={() => setActiveIdx(i)}
                  style={{
                    flexShrink: 0, width: 82, padding: '8px 6px',
                    borderRadius: 12, cursor: 'pointer',
                    border: `1px solid ${isAct
                      ? (isLiveM ? 'rgba(245,194,0,0.55)' : 'rgba(91,130,180,0.55)')
                      : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)')}`,
                    background: isAct
                      ? (isLiveM
                        ? (isDark ? 'rgba(245,194,0,0.14)' : 'rgba(245,194,0,0.08)')
                        : (isDark ? 'rgba(91,130,180,0.14)' : 'rgba(91,130,180,0.08)'))
                      : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    WebkitTapHighlightColor: 'transparent', overflow: 'hidden', position: 'relative',
                  } as any}>
                  {isStreamM ? (
                    <motion.div
                      animate={{ opacity: [1, 0.25, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ fontSize: 8, fontWeight: 800, color: '#e05555', letterSpacing: 0.5, marginTop: 2 }}>
                      ● LIVE
                    </motion.div>
                  ) : (
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: isLiveM ? GREEN_S : dc, letterSpacing: 0.2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 72, marginTop: 2 }}>
                      {shortDiv(m.division)}
                    </div>
                  )}
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: homeWin ? C.text : C.textMuted,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>
                    {shortName(m.home?.name || '')}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    color: isLiveM ? GREEN_S : C.accent }}>
                    {hasScore ? `${m.home_score}–${m.away_score}` : (cd || time || 'vs')}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: awayWin ? C.text : C.textMuted,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>
                    {shortName(m.away?.name || '')}
                  </div>
                </button>
              )
            }
            // Tävling strip card — always gold
            return (
              <button key={it.id} onClick={() => setActiveIdx(i)}
                style={{
                  flexShrink: 0, width: 82, padding: '8px 6px',
                  borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${isAct ? 'rgba(245,194,0,0.55)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)')}`,
                  background: isAct
                    ? (isDark ? 'rgba(245,194,0,0.14)' : 'rgba(245,194,0,0.08)')
                    : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  WebkitTapHighlightColor: 'transparent', overflow: 'hidden', position: 'relative',
                } as any}>
                <span style={{ fontSize: 15, color: '#f5c200', lineHeight: 1 }}>◆</span>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#f5c200', textAlign: 'center',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>
                  {it.name}
                </div>
                <div style={{ fontSize: 8, color: C.textMuted }}>{it.dateLabel}</div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

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
  const [tableDiv, setTableDiv] = useState<'Elitserien Herrar' | 'Elitserien Damer'>('Elitserien Herrar')
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

      setLoading(false)
    })
  }, [])

  if (loading) {
    const skelClr = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
    const S = ({ w = '100%', h = 12, r = 6, style = {} }: { w?: number | string; h?: number; r?: number; style?: React.CSSProperties }) => (
      <div style={{ width: w, height: h, borderRadius: r, background: skelClr, flexShrink: 0, ...style }} />
    )
    return (
      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
        <style>{`@keyframes skel-pulse{0%,100%{opacity:.45}50%{opacity:1}}.skel-wrap>*{animation:skel-pulse 1.6s ease-in-out infinite}`}</style>
        <div className="skel-wrap" style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

          {/* Din nästa match card */}
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(91,130,180,0.2)' : 'rgba(91,130,180,0.15)'}` }}>
              <div style={{ height: 3, background: skelClr }} />
              <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <S w={110} h={9} />
                  <S w={48} h={18} r={4} style={{ marginLeft: 'auto' }} />
                  <S w={52} h={18} r={8} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <S w="70%" h={14} />
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[0,1,2,3,4].map(i => <S key={i} w={6} h={6} r={99} />)}
                    </div>
                    <S w={36} h={8} />
                  </div>
                  <div style={{ flexShrink: 0, minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <S w={56} h={26} r={6} />
                    <S w={44} h={8} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <S w="70%" h={14} />
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[0,1,2,3,4].map(i => <S key={i} w={6} h={6} r={99} />)}
                    </div>
                    <S w={36} h={8} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero strip */}
          <div style={{ padding: '16px 16px 0', display: 'flex', gap: 12, overflowX: 'hidden' }}>
            {[0].map(i => (
              <div key={i} style={{ flex: '0 0 calc(100% - 40px)', borderRadius: 16, overflow: 'hidden',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
                <div style={{ height: 3, background: skelClr }} />
                <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <S w={80} h={9} />
                    <S w={52} h={18} r={4} style={{ marginLeft: 'auto' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <S w="80%" h={16} />
                      <S w={32} h={8} />
                    </div>
                    <div style={{ flexShrink: 0, width: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <S w={64} h={36} r={8} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <S w="80%" h={16} />
                      <S w={32} h={8} />
                    </div>
                  </div>
                  <S w="60%" h={10} style={{ alignSelf: 'center' }} />
                </div>
              </div>
            ))}
            <div style={{ flex: '0 0 28px' }} />
          </div>

          {/* Honor roll */}
          <div style={{ marginTop: 28, padding: '0 16px' }}>
            <S w={120} h={10} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 10, overflowX: 'hidden' }}>
              {[96, 80, 74, 74, 74].map((w, i) => (
                <div key={i} style={{ flexShrink: 0, width: w, borderRadius: 12,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  padding: '10px 8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <S w={40} h={8} />
                  <S w={i === 0 ? 48 : 40} h={i === 0 ? 44 : 28} r={6} />
                  <S w="80%" h={9} />
                  <S w="60%" h={8} />
                </div>
              ))}
            </div>
          </div>

          {/* Ligatabell */}
          <div style={{ marginTop: 28, padding: '0 16px' }}>
            <S w={100} h={10} style={{ marginBottom: 12 }} />
            <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
              {[0,1,2,3,4,5,6,7].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
                  borderBottom: i < 7 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none' }}>
                  <S w={16} h={10} r={3} />
                  <S w={`${55 + (i % 3) * 15}%`} h={10} />
                  <S w={20} h={10} r={3} style={{ marginLeft: 'auto' }} />
                  <S w={24} h={10} r={3} />
                </div>
              ))}
            </div>
          </div>

          {/* Match list rows */}
          <div style={{ marginTop: 28, padding: '0 16px' }}>
            <S w={130} h={10} style={{ marginBottom: 12 }} />
            <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 12px',
                  borderBottom: i < 4 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none' }}>
                  <div style={{ width: 3, height: 32, borderRadius: 2, background: skelClr, flexShrink: 0 }} />
                  <S w="40%" h={12} style={{ marginLeft: 4 }} />
                  <S w={60} h={22} r={6} style={{ marginLeft: 'auto', marginRight: 'auto' }} />
                  <S w="40%" h={12} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    )
  }

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

  const tableRows: TableRow[] = DEMO ? (MOCK_TABLES[tableDiv] ?? []) : []
  const myNextMatch: Match | null = DEMO
    ? (filteredUpcoming[0] ?? null)
    : (session && followedIds.size > 0
        ? upcoming.find(m => {
            const hId = (m.home as any)?.id; const aId = (m.away as any)?.id
            return (hId && followedIds.has(hId)) || (aId && followedIds.has(aId))
          }) ?? null
        : null)

  const myPlayer = DEMO ? MOCK_MY_PLAYER : null

  // ── Sub-components (defined inside render to access C, isDark, now) ──────────

  const MatchRow = ({ m }: { m: Match }) => {
    const dayColor = dayDotColor(m.date.slice(0, 10))
    const hasScore = m.home_score !== null
    const homeWin  = hasScore && m.home_score! > m.away_score!
    const awayWin  = hasScore && m.away_score! > m.home_score!
    return (
      <a href={'/matches/' + m.id}
        style={{ display: 'flex', alignItems: 'stretch', textDecoration: 'none',
          borderRadius: 0, margin: 0, overflow: 'hidden',
          WebkitTapHighlightColor: 'transparent' } as any}
        onMouseEnter={e => (e.currentTarget.style.background = C.card)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ width: 3, flexShrink: 0, background: dayColor, opacity: 0.7 }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: '13px 12px', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: homeWin ? 700 : 400,
            color: hasScore ? (homeWin ? C.text : C.textMuted) : C.text,
            textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortName(m.home?.name || '')}
          </div>
          <div style={{ flexShrink: 0, width: 72, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {hasScore ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: homeWin ? C.accent : C.textMuted }}>{m.home_score}</span>
                  <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 300 }}>–</span>
                  <span style={{ fontSize: 17, fontWeight: 900, color: awayWin ? C.accent : C.textMuted }}>{m.away_score}</span>
                </div>
                <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 0.3, marginTop: 2 }}>{shortDiv(m.division)}</div>
              </>
            ) : (() => {
              const cd      = countdown(m.date, now)
              const timeStr = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              return (
                <>
                  {cd
                    ? <div style={{ fontSize: 14, fontWeight: 800, color: C.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{cd}</div>
                    : <div style={{ fontSize: 12, color: C.textMuted }}>{timeStr || 'vs'}</div>
                  }
                  <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 0.3, marginTop: 2 }}>{shortDiv(m.division)}</div>
                </>
              )
            })()}
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: awayWin ? 700 : 400,
            color: hasScore ? (awayWin ? C.text : C.textMuted) : C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortName(m.away?.name || '')}
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

        {/* ── Din nästa match (top card) ────────────────────────────────────────── */}
        {myNextMatch && !nextMatchHidden && (() => {
          const m         = myNextMatch
          const cd        = countdown(m.date, now)
          const time      = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
          const dStr      = m.date.slice(0, 10)
          const streams   = m.streams ?? []
          const isMyHome  = DEMO ? true : followedIds.has((m.home as any)?.id)
          type FormResult = 'W' | 'L' | 'D'
          const MOCK_FORM: Record<string, FormResult[]> = {
            'demo-t3': ['W', 'W', 'D', 'W', 'L'],
            'demo-t4': ['L', 'D', 'W', 'L', 'W'],
          }
          const homeForm: FormResult[] = DEMO ? (MOCK_FORM[m.home.id] ?? []) : []
          const awayForm: FormResult[] = DEMO ? (MOCK_FORM[m.away.id] ?? []) : []
          const formColor = (r: FormResult) => r === 'W' ? '#5a82b4' : r === 'L' ? '#e05555' : C.textMuted

          return (
            <div style={{ padding: '12px 16px 0' }}>
              <a href={'/matches/' + m.id} style={{ display: 'block', borderRadius: 16, overflow: 'hidden', textDecoration: 'none',
                border: `1px solid ${isDark ? 'rgba(91,130,180,0.32)' : 'rgba(91,130,180,0.38)'}`,
                background: isDark
                  ? 'linear-gradient(145deg, rgba(91,130,180,0.13) 0%, rgba(11,21,40,0.98) 100%)'
                  : 'linear-gradient(145deg, rgba(91,130,180,0.08) 0%, rgba(248,248,252,1) 100%)',
                WebkitTapHighlightColor: 'transparent',
              } as any}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #5a82b4, rgba(91,130,180,0.15))' }} />
                <div style={{ padding: '14px 16px 16px' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#5a82b4', letterSpacing: 1.4, flex: 1 }}>DIN NÄSTA MATCH</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: divColor(m.division),
                      background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                      padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3, marginRight: 8 }}>
                      {shortDiv(m.division)}
                    </span>
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleNextMatch() }}
                      style={{ padding: '3px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                        fontSize: 9, fontWeight: 700, color: C.textMuted,
                        WebkitTapHighlightColor: 'transparent' } as any}>
                      dölj ↓
                    </button>
                  </div>

                  {/* Teams + countdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                    {/* Home */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.text,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortName(m.home?.name || '')}
                      </div>
                      <div style={{ fontSize: 9, color: isMyHome ? '#5a82b4' : C.textMuted, fontWeight: isMyHome ? 700 : 400, marginTop: 3 }}>
                        {isMyHome ? 'MITT LAG' : 'Hemma'}
                      </div>
                      {homeForm.length > 0 && (
                        <>
                          <div style={{ fontSize: 7, color: C.textMuted, fontWeight: 600, letterSpacing: 0.8, marginTop: 6, textAlign: 'right' }}>FORM</div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 3, marginTop: 3 }}>
                            {homeForm.map((r, i) => (
                              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: formColor(r) }} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Countdown */}
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 88 }}>
                      {cd ? (
                        <>
                          <div style={{ fontSize: 28, fontWeight: 900, color: C.accent,
                            fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{cd}</div>
                          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 6 }}>
                            {dateLabel(dStr)} · {time}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{time}</div>
                          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>{dateLabel(dStr)}</div>
                        </>
                      )}
                    </div>

                    {/* Away */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.text,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortName(m.away?.name || '')}
                      </div>
                      <div style={{ fontSize: 9, color: !isMyHome ? '#5a82b4' : C.textMuted, fontWeight: !isMyHome ? 700 : 400, marginTop: 3 }}>
                        {!isMyHome ? 'MITT LAG' : 'Borta'}
                      </div>
                      {awayForm.length > 0 && (
                        <>
                          <div style={{ fontSize: 7, color: C.textMuted, fontWeight: 600, letterSpacing: 0.8, marginTop: 6 }}>FORM</div>
                          <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                            {awayForm.map((r, i) => (
                              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: formColor(r) }} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Venue + oil profile */}
                  {(m.venue || m.oilProfile) && (
                    <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, color: C.textMuted }}>
                      {[m.venue, m.oilProfile].filter(Boolean).join(' · ')}
                    </div>
                  )}

                  {/* Stream pills or KOMMANDE indicator */}
                  {streams.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 14 }}>
                      {streams.map((s, idx) => {
                        const ss = streamStyle(s.url)
                        return (
                          <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 10, fontWeight: 700, color: ss.color,
                              background: ss.bg, border: `1px solid ${ss.border}`,
                              borderRadius: 8, padding: '5px 10px', textDecoration: 'none',
                              display: 'flex', alignItems: 'center', gap: 5,
                              WebkitTapHighlightColor: 'transparent' } as any}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color, flexShrink: 0, display: 'inline-block' }} />
                            {ss.label}
                          </a>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#5a82b4', opacity: 0.7 }} />
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#5a82b4', letterSpacing: 1.2 }}>KOMMANDE</span>
                    </div>
                  )}
                </div>
              </a>
            </div>
          )
        })()}

                {/* ── Hero strip ───────────────────────────────────────────────────────── */}
        {(liveItems.length > 0 || upcomingItems.length > 0) && (
          <HeroStrip liveItems={liveItems} upcomingItems={upcomingItems} C={C} isDark={isDark} now={now} />
        )}


        {/* ── MATCHPULSEN ──────────────────────────────────────────────────────── */}
        {filteredLive.length > 0 && (() => {
          const sorted = [...filteredLive].sort((a, b) => tensionScore(b) - tensionScore(a))
          const hot = sorted[0]
          const score = tensionScore(hot)
          const h = hot.home_score!, a = hot.away_score!
          const isTied = h === a
          const isFollowed = followedIds.has(hot.home.id) || followedIds.has(hot.away.id)
          const needleClr = tensionColor(score, C.textMuted)
          const streams = hot.streams ?? []
          const insight = tensionInsight(hot)

          // SVG gauge geometry
          const cx = 50, cy = 60, r = 44, sw = 9
          const arcLen = Math.PI * r
          const dashOffset = arcLen * (1 - score)
          const z65a = Math.PI * (1 - 0.65)
          const z65x = cx + r * Math.cos(z65a), z65y = cy - r * Math.sin(z65a)
          const needleLen = 32
          const needleDeg = -(score * 180)

          const borderClr = isFollowed
            ? 'rgba(245,194,0,0.5)'
            : isTied ? 'rgba(245,194,0,0.35)'
            : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

          return (
            <div style={{ padding: '16px 16px 0' }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', textDecoration: 'none',
                border: `1px solid ${borderClr}`,
                boxShadow: isFollowed ? '0 0 0 3px rgba(245,194,0,0.12), 0 0 28px rgba(245,194,0,0.1)' : undefined,
                background: isTied
                  ? (isDark ? 'linear-gradient(145deg,rgba(245,194,0,0.08) 0%,rgba(11,21,40,0.98) 100%)' : 'linear-gradient(145deg,rgba(245,194,0,0.04) 0%,rgba(248,248,252,1) 100%)')
                  : (isDark ? 'linear-gradient(145deg,rgba(255,255,255,0.03) 0%,rgba(11,21,40,0.98) 100%)' : 'linear-gradient(145deg,rgba(0,0,0,0.02) 0%,rgba(248,248,252,1) 100%)') }}>
                <div style={{ height: 3, background: `linear-gradient(90deg,${needleClr},${needleClr}30)` }} />
                <div style={{ padding: '12px 16px 16px' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: needleClr, letterSpacing: 1.4, flex: 1 }}>MATCHPULSEN</span>
                    {isFollowed && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#f5c200',
                        background: 'rgba(245,194,0,0.12)', border: '1px solid rgba(245,194,0,0.3)',
                        padding: '2px 7px', borderRadius: 4, letterSpacing: 0.3 }}>DITT LAG</span>
                    )}
                    <span style={{ fontSize: 9, fontWeight: 700, color: divColor(hot.division),
                      background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                      padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3 }}>{shortDiv(hot.division)}</span>
                  </div>

                  {/* 3-col: home | gauge | away */}
                  <a href={'/matches/' + hot.id} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', WebkitTapHighlightColor: 'transparent' } as any}>
                    {/* Home */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2, letterSpacing: 0.5 }}>HEMMA</div>
                      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                        color: h > a ? C.text : isTied ? C.text : C.textMuted }}>{h}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, marginTop: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: h > a ? C.text : isTied ? C.text : C.textMuted }}>
                        {shortName(hot.home?.name || '')}
                      </div>
                    </div>

                    {/* Gauge */}
                    <div style={{ flexShrink: 0, width: 100 }}>
                      <svg viewBox="0 0 100 66" style={{ width: '100%', display: 'block' }}>
                        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
                          fill="none" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                          strokeWidth={sw} strokeLinecap="butt" />
                        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${z65x} ${z65y}`}
                          fill="none" stroke="rgba(56,160,136,0.2)" strokeWidth={sw} strokeLinecap="butt" />
                        <path d={`M ${z65x} ${z65y} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
                          fill="none" stroke="rgba(245,194,0,0.2)" strokeWidth={sw} strokeLinecap="butt" />
                        <motion.path
                          d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
                          fill="none" stroke={needleClr} strokeWidth={sw} strokeLinecap="round"
                          strokeDasharray={arcLen}
                          initial={{ strokeDashoffset: arcLen }}
                          animate={{ strokeDashoffset: dashOffset }}
                          transition={{ duration: 1.0, ease: 'easeOut' }}
                          style={isTied ? { filter: `drop-shadow(0 0 4px ${needleClr})` } : {}}
                        />
                        {[0.25, 0.5, 0.75].map(t => {
                          const ta = Math.PI * (1 - t)
                          const x1 = cx + (r - sw/2 - 1) * Math.cos(ta)
                          const y1 = cy - (r - sw/2 - 1) * Math.sin(ta)
                          const x2 = cx + (r + sw/2 + 1) * Math.cos(ta)
                          const y2 = cy - (r + sw/2 + 1) * Math.sin(ta)
                          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.16)'} strokeWidth={1} />
                        })}
                        <motion.g
                          initial={{ rotate: 0 }}
                          animate={{ rotate: needleDeg }}
                          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                          style={{ transformOrigin: `${cx}px ${cy}px` }}>
                          <line x1={cx} y1={cy} x2={cx - needleLen} y2={cy}
                            stroke={needleClr} strokeWidth={2} strokeLinecap="round" />
                        </motion.g>
                        <circle cx={cx} cy={cy} r={4} fill={needleClr} />
                        <circle cx={cx} cy={cy} r={2} fill={isDark ? '#10161e' : '#f5f2ec'} />
                      </svg>
                    </div>

                    {/* Away */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2, letterSpacing: 0.5 }}>BORTA</div>
                      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                        color: a > h ? C.text : isTied ? C.text : C.textMuted }}>{a}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, marginTop: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: a > h ? C.text : isTied ? C.text : C.textMuted }}>
                        {shortName(hot.away?.name || '')}
                      </div>
                    </div>
                  </a>

                  {/* Context insight */}
                  {insight && (
                    <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, fontWeight: 700,
                      color: needleClr, letterSpacing: 0.4 }}>
                      {insight}
                    </div>
                  )}

                  {/* Stream pills */}
                  {streams.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 10 }}>
                      {streams.map((s, idx) => {
                        const ss = streamStyle(s.url)
                        return (
                          <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 10, fontWeight: 700, color: ss.color,
                              background: ss.bg, border: `1px solid ${ss.border}`,
                              borderRadius: 8, padding: '5px 10px', textDecoration: 'none',
                              display: 'flex', alignItems: 'center', gap: 5,
                              WebkitTapHighlightColor: 'transparent' } as any}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color, flexShrink: 0, display: 'inline-block' }} />
                            {ss.label}
                          </a>
                        )
                      })}
                    </div>
                  )}

                  {/* Heat list — other live matches */}
                  {sorted.length > 1 && (
                    <div style={{ marginTop: 12, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, paddingTop: 10 }}>
                      <div style={{ fontSize: 8, fontWeight: 800, color: C.textMuted, letterSpacing: 1.4, marginBottom: 6 }}>
                        ALLA LIVE
                      </div>
                      {sorted.slice(1).map((m, idx) => {
                        const ms = tensionScore(m)
                        const dotClr = tensionColor(ms, C.textMuted)
                        const mh = m.home_score!, ma = m.away_score!
                        const isLast = idx === sorted.length - 2
                        return (
                          <a key={m.id} href={'/matches/' + m.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 8,
                              padding: '7px 0', textDecoration: 'none',
                              borderBottom: isLast ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                              WebkitTapHighlightColor: 'transparent' } as any}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotClr, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.text,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {shortName(m.home.name)} – {shortName(m.away.name)}
                              </div>
                              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>{shortDiv(m.division)}</div>
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                              color: mh === ma ? '#f5c200' : C.text, flexShrink: 0 }}>
                              {mh}–{ma}
                            </div>
                            <div style={{ width: 28, height: 3, borderRadius: 2, flexShrink: 0,
                              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${ms * 100}%`, background: dotClr, borderRadius: 2 }} />
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  )}

                  {/* Link to full /puls page */}
                  <div style={{ marginTop: 12, paddingTop: 12,
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                    textAlign: 'center' }}>
                    <a href="/puls" style={{ fontSize: 9, fontWeight: 800, color: needleClr,
                      textDecoration: 'none', letterSpacing: 1.0 }}>
                      SE MATCHPULSEN →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

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
                const isPerfect    = e.score === 300
                const isHighSeries = !isPerfect && (e.seriesTotal ?? 0) >= 950
                const isElite      = !isPerfect && !isHighSeries && e.score >= 250
                // isGold: 220–249 (threshold raised, no lower tier)

                const nameParts = e.playerName.split(' ')
                const firstName = nameParts[0]
                const lastName  = nameParts.slice(1).join(' ')

                // ── Perfect game: Black Diamond ──────────────────────────────
                if (isPerfect) return (
                  <a key={i} href={'/matches/' + e.matchId} style={{
                    flexShrink: 0, textDecoration: 'none', borderRadius: 14,
                    padding: '12px 14px', textAlign: 'center', minWidth: 96,
                    background: '#000000',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: 'inset 0 0 28px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)',
                  }}>
                    <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <div style={{
                        fontSize: 7, fontWeight: 900, letterSpacing: 1.8,
                        background: 'linear-gradient(90deg, #8a98b8, #ffffff 48%, #8a98b8)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>◆ PERFECT</div>
                    </div>
                    <div style={{
                      fontSize: 48, fontWeight: 900, lineHeight: 1, color: '#ffffff',
                      textShadow: '0 0 2px #fff, 0 0 10px rgba(255,255,255,0.75), 0 0 28px rgba(255,255,255,0.25)',
                    }}>300</div>
                    {e.seriesTotal && (
                      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, marginTop: 4,
                        color: 'rgba(170,185,220,0.6)' }}>{e.seriesTotal} serie</div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 7,
                      color: 'rgba(215,222,240,0.85)', maxWidth: 84,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                    <div style={{ fontSize: 10, color: 'rgba(140,155,185,0.7)', maxWidth: 84,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
                  </a>
                )

                // ── 950+ series: Series Diamond ──────────────────────────────
                if (isHighSeries) return (
                  <a key={i} href={'/matches/' + e.matchId} style={{
                    flexShrink: 0, textDecoration: 'none', borderRadius: 13,
                    padding: '12px 14px', textAlign: 'center', minWidth: 86,
                    background: '#07080e',
                    border: '1px solid rgba(255,255,255,0.11)',
                    boxShadow: 'inset 0 0 18px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.45)',
                  }}>
                    <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <div style={{
                        fontSize: 7, fontWeight: 800, letterSpacing: 1.5,
                        background: 'linear-gradient(90deg, #6a7a9a, #bcc8e0 50%, #6a7a9a)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>◇ SERIE</div>
                    </div>
                    <div style={{
                      fontSize: 36, fontWeight: 900, lineHeight: 1, color: '#d8dff0',
                      textShadow: '0 0 8px rgba(205,218,255,0.55), 0 0 22px rgba(175,198,255,0.2)',
                    }}>{e.seriesTotal}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, marginTop: 3,
                      color: 'rgba(130,150,195,0.65)' }}>{e.score} bäst</div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6,
                      color: 'rgba(195,208,235,0.8)', maxWidth: 80,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                    <div style={{ fontSize: 10, color: 'rgba(115,132,170,0.7)', maxWidth: 80,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
                  </a>
                )

                // ── Elite (250+) and Gold (220–249) ────────────────────────────
                const cardBorder = isElite ? 'rgba(245,194,0,0.4)' : 'rgba(245,194,0,0.25)'
                const cardBg     = isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.04)'
                const label      = isElite ? '★ ELITE' : '◼︎ TOP'
                return (
                  <a key={i} href={'/matches/' + e.matchId}
                    style={{ flexShrink: 0, textDecoration: 'none',
                      background: cardBg,
                      border: `1px solid ${cardBorder}`, borderRadius: 12,
                      padding: '12px 14px', textAlign: 'center', minWidth: 84,
                      boxShadow: isElite ? '0 0 20px rgba(245,194,0,0.08)' : 'none' } as any}>
                    <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <div style={{
                        fontSize: 7, fontWeight: 800, letterSpacing: 1.5,
                        background: 'linear-gradient(90deg, #c8a830, #f5c200 50%, #c8a830)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>{label}</div>
                    </div>
                    {isElite ? (
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', lineHeight: 1,
                        textShadow: '0 0 8px rgba(255,255,255,0.55), 0 0 22px rgba(255,255,255,0.18)' }}>{e.score}</div>
                    ) : (
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#f5c200', lineHeight: 1,
                        textShadow: '0 0 8px rgba(245,194,0,0.5), 0 0 20px rgba(245,194,0,0.2)' }}>{e.score}</div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginTop: 8,
                      maxWidth: 78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                    <div style={{ fontSize: 10, color: C.textMuted,
                      maxWidth: 78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Personlig profil ─────────────────────────────────────────────── */}
        {myPlayer && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ borderRadius: 16, overflow: 'hidden',
              border: `1px solid ${isDark ? 'rgba(56,160,136,0.28)' : 'rgba(56,160,136,0.32)'}`,
              background: isDark
                ? 'linear-gradient(145deg, rgba(56,160,136,0.1) 0%, rgba(11,21,40,0.98) 100%)'
                : 'linear-gradient(145deg, rgba(56,160,136,0.06) 0%, rgba(248,248,252,1) 100%)' }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, #38a088, rgba(56,160,136,0.15))' }} />
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#38a088', letterSpacing: 1.4, flex: 1 }}>MIN PROFIL</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted,
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3 }}>Säsong 2026</span>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{myPlayer.name}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>
                    {myPlayer.team} · {shortDiv(myPlayer.division)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 0.8, marginBottom: 4 }}>SNITT</div>
                    <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: '#38a088',
                      fontVariantNumeric: 'tabular-nums' }}>{myPlayer.average}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 }}>SENASTE 5</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
                      {myPlayer.lastScores.map((score, i) => {
                        const pct = (score - 150) / (300 - 150)
                        const barH = Math.round(4 + pct * 36)
                        const isHigh = score >= 220
                        const isAbove = score >= myPlayer.average
                        const barClr = isHigh ? '#f5c200' : isAbove ? '#38a088' : C.textMuted
                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 28, display: 'flex', alignItems: 'flex-end', height: 40 }}>
                              <div style={{ width: '100%', height: barH, borderRadius: 4, background: barClr,
                                opacity: i === myPlayer.lastScores.length - 1 ? 1 : 0.7 }} />
                            </div>
                            <span style={{ fontSize: 9, color: barClr, fontWeight: isHigh ? 800 : 500,
                              fontVariantNumeric: 'tabular-nums' }}>{score}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Mini ligatabell ─────────────────────────────────────────── */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, flex: 1 }}>LIGATABELL</span>
            {(['Elitserien Herrar', 'Elitserien Damer'] as const).map(div => (
              <button key={div} onClick={() => setTableDiv(div)}
                style={{ fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 8, marginLeft: 6,
                  cursor: 'pointer', border: 'none',
                  background: tableDiv === div ? '#f5c200' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  color: tableDiv === div ? '#1a1400' : C.textMuted,
                  WebkitTapHighlightColor: 'transparent' } as any}>
                {div === 'Elitserien Herrar' ? 'Elit H' : 'Elit D'}
              </button>
            ))}
          </div>
          <div style={{ borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center',
              borderBottom: '1px solid ' + C.border,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
              <div style={{ width: 3, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '28px 1fr 26px 34px',
                padding: '5px 12px' }}>
                {(['#', 'Lag', 'M', 'MP'] as const).map((h, i) => (
                  <span key={h} style={{ fontSize: 9, color: C.textMuted, fontWeight: 700,
                    textAlign: i >= 2 ? 'center' as const : 'left' as const }}>{h}</span>
                ))}
              </div>
            </div>
            {tableRows.slice(0, 5).map((row, i) => {
              const zoneClr = row.rank <= 2 ? '#f5c200' : row.rank <= 6 ? '#38a088'
                : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')
              const isMyTeam = followedIds.has(row.teamId)
              return (
                <a key={row.teamId} href={'/teams/' + row.teamId}
                  style={{ display: 'flex', alignItems: 'center', textDecoration: 'none',
                    borderTop: i > 0 ? '1px solid ' + C.border : 'none',
                    background: isMyTeam
                      ? (isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.05)')
                      : 'transparent',
                    WebkitTapHighlightColor: 'transparent' } as any}
                  onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                  onMouseLeave={e => (e.currentTarget.style.background = isMyTeam
                    ? (isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.05)')
                    : 'transparent')}>
                  <div style={{ width: 3, flexShrink: 0, alignSelf: 'stretch', background: zoneClr }} />
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '28px 1fr 26px 34px',
                    padding: '9px 12px', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: row.rank <= 6 ? zoneClr : C.textMuted, textAlign: 'center' }}>{row.rank}</span>
                    <span style={{ fontSize: 13, fontWeight: isMyTeam ? 700 : 400, color: C.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4 }}>
                      {shortName(row.teamName)}
                    </span>
                    <span style={{ fontSize: 11, color: C.textMuted, textAlign: 'center' }}>{row.played}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, textAlign: 'center',
                      color: row.rank <= 2 ? '#f5c200' : C.text }}>{row.points}</span>
                  </div>
                </a>
              )
            })}
            <a href="/league" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '9px 12px', fontSize: 11, fontWeight: 600, color: C.textMuted,
              textDecoration: 'none', borderTop: '1px solid ' + C.border,
              background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
              WebkitTapHighlightColor: 'transparent' } as any}>
              Visa hela tabellen →
            </a>
          </div>
        </div>

        {/* ── Recent results ───────────────────────────────────────────────────── */}
        {recentDates.length > 0 && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, marginBottom: 10 }}>
              SENASTE RESULTAT
            </div>
            {recentDates.map(date => {
              const all        = recentByDate[date]
              const isExpanded = expandedDates.has(date)
              const visible    = isExpanded ? all : all.slice(0, LIMIT)
              const hidden     = all.length - LIMIT
              return (
                <div key={date} style={{ marginBottom: 12, borderRadius: 14,
                  border: '1px solid ' + C.border, overflow: 'hidden' }}>
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                    borderBottom: '1px solid ' + C.border,
                    background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: dayDotColor(date), flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{dateLabel(date)}</span>
                    <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 2 }}>· {all.length} matcher</span>
                  </div>
                  {/* Rows */}
                  {visible.map((m, i) => (
                    <div key={m.id} style={{ borderTop: i > 0 ? '1px solid ' + C.border : 'none' }}>
                      <MatchRow m={m} />
                    </div>
                  ))}
                  {/* Expand */}
                  {hidden > 0 && (
                    <button onClick={() => toggleDate(date)}
                      style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none',
                        borderTop: '1px solid ' + C.border, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                      {isExpanded ? '↑ Visa färre' : `Visa alla ${all.length} matcher ↓`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Remaining upcoming ───────────────────────────────────────────────── */}
        {upcomingDates.length > 0 && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, marginBottom: 10 }}>
              KOMMANDE MATCHER
            </div>
            {upcomingDates.map(date => {
              const all        = upcomingByDate[date]
              const key        = 'up-' + date
              const isExpanded = expandedDates.has(key)
              const visible    = isExpanded ? all : all.slice(0, LIMIT)
              const hidden     = all.length - LIMIT
              return (
                <div key={date} style={{ marginBottom: 12, borderRadius: 14,
                  border: '1px solid ' + C.border, overflow: 'hidden' }}>
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                    borderBottom: '1px solid ' + C.border,
                    background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: dayDotColor(date), flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{dateLabel(date)}</span>
                    <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 2 }}>· {all.length} matcher</span>
                  </div>
                  {/* Rows */}
                  {visible.map((m, i) => (
                    <div key={m.id} style={{ borderTop: i > 0 ? '1px solid ' + C.border : 'none' }}>
                      <MatchRow m={m} />
                    </div>
                  ))}
                  {/* Expand */}
                  {hidden > 0 && (
                    <button onClick={() => toggleDate(key)}
                      style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none',
                        borderTop: '1px solid ' + C.border, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                      {isExpanded ? '↑ Visa färre' : `Visa alla ${all.length} matcher ↓`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── SLLM promo ───────────────────────────────────────────────────────── */}
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

        {/* ── Din nästa match compact strip (when hidden) / Login CTA ──────────── */}
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
