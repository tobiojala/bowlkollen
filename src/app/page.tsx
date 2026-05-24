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
}
type HonorEntry = { playerName: string; score: number; matchId: string; seriesTotal?: number }

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
  {
    id: 'demo-live-2', date: new Date().toISOString(), status: 'live',
    division: 'Elitserien Damer', home_score: 3, away_score: 3,
    home: { id: 'demo-t5', name: 'Örebro BK' },
    away: { id: 'demo-t6', name: 'Malmö BK' },
  },
  {
    id: 'demo-live-3', date: new Date().toISOString(), status: 'live',
    division: 'Allsvenskan Herrar', home_score: 2, away_score: 4,
    home: { id: 'demo-t3', name: 'Göteborgs BK' },
    away: { id: 'demo-t4', name: 'Linköpings BK' },
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
  { playerName: 'Jesper Svensson', score: 300, matchId: 'demo-r-1', seriesTotal: 778 },
  { playerName: 'Martin Larsen',   score: 289, matchId: 'demo-r-2', seriesTotal: 712 },
  { playerName: 'Marcus Lindgren', score: 279, matchId: 'demo-r-1' },
  { playerName: 'Sara Holmberg',   score: 256, matchId: 'demo-r-2' },
  { playerName: 'Jonas Persson',   score: 245, matchId: 'demo-r-3' },
  { playerName: 'Anna Karlsson',   score: 234, matchId: 'demo-r-4' },
  { playerName: 'Erik Svensson',   score: 224, matchId: 'demo-r-5' },
  { playerName: 'Lena Bergström',  score: 218, matchId: 'demo-r-6' },
]

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

const DAY_COLORS = ['#b06070', '#6080b8', '#8868b0', '#4a9e96', '#b07840', '#a85888', '#9e8840']
const dayDotColor = (dateStr: string) => DAY_COLORS[new Date(dateStr + 'T12:00:00').getDay()]

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
          {([['live', '● LIVE', liveItems.length], ['upcoming', 'KOMMANDE', upcomingItems.length]] as const).map(([m, label, count]) => {
            const isAct = mode === m
            const clr   = m === 'live' ? '#e05555' : '#f5c200'
            return (
              <button key={m} onClick={() => switchMode(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', border: 'none',
                  background: isAct
                    ? (isDark ? `rgba(${m === 'live' ? '224,85,85' : '245,194,0'},0.15)` : `rgba(${m === 'live' ? '224,85,85' : '245,194,0'},0.1)`)
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
                  background: isAct ? `rgba(${m === 'live' ? '224,85,85' : '245,194,0'},0.18)` : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
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
              const topClr   = isLive ? '#e05555' : '#f5c200'
              const bgFrom   = isLive
                ? (isDark ? 'rgba(224,85,85,0.13)' : 'rgba(224,85,85,0.07)')
                : (isDark ? 'rgba(245,194,0,0.08)'  : 'rgba(245,194,0,0.06)')
              const edgeClr  = isLive
                ? 'rgba(224,85,85,0.3)'
                : (isDark ? 'rgba(245,194,0,0.2)' : 'rgba(245,194,0,0.28)')
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e05555', boxShadow: '0 0 6px #e05555' }} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#e05555', letterSpacing: 1.5 }}>LIVE</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>NÄSTA MATCH</span>
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
                        {!hasScore && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>Hemma</div>}
                      </div>

                      <div style={{ flexShrink: 0, width: 88, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {hasScore ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: homeWin ? C.accent : C.text }}>{m.home_score}</span>
                            <span style={{ fontSize: 22, color: C.textMuted, fontWeight: 200, marginTop: -2 }}>–</span>
                            <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: awayWin ? C.accent : C.text }}>{m.away_score}</span>
                          </div>
                        ) : cd ? (
                          <>
                            <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: C.accent, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>{cd}</div>
                            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 5, textAlign: 'center' }}>{time}</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, textAlign: 'center' }}>{time || 'vs'}</div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: hasScore ? (awayWin ? C.text : C.textMuted) : C.text }}>
                          {shortName(m.away?.name || '')}
                        </div>
                        {!hasScore && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>Borta</div>}
                      </div>
                    </div>

                    <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
                      color: isLive ? 'rgba(224,85,85,0.65)' : C.textMuted }}>
                      {isLive ? 'Tryck för detaljer →' : `${dateLabel(dateStr)} · ${time}`}
                    </div>
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
              const isLiveM  = m.status === 'live'
              const cd       = !hasScore ? countdown(m.date, now) : null
              const time     = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              return (
                <button key={m.id} onClick={() => setActiveIdx(i)}
                  style={{
                    flexShrink: 0, width: 82, padding: '8px 6px',
                    borderRadius: 12, cursor: 'pointer',
                    border: `1px solid ${isAct
                      ? (isLiveM ? 'rgba(224,85,85,0.55)' : 'rgba(245,194,0,0.55)')
                      : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)')}`,
                    background: isAct
                      ? (isLiveM
                        ? (isDark ? 'rgba(224,85,85,0.14)' : 'rgba(224,85,85,0.08)')
                        : (isDark ? 'rgba(245,194,0,0.14)'  : 'rgba(245,194,0,0.08)'))
                      : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    WebkitTapHighlightColor: 'transparent', overflow: 'hidden', position: 'relative',
                  } as any}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: isLiveM ? '#e05555' : dc }} />
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: dc, letterSpacing: 0.2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 72, marginTop: 2 }}>
                    {shortDiv(m.division)}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: homeWin ? C.text : C.textMuted,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>
                    {shortName(m.home?.name || '')}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    color: isLiveM ? '#e05555' : C.accent }}>
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
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: '#f5c200' }} />
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

  // ── Sub-components (defined inside render to access C, isDark, now) ──────────

  const MatchRow = ({ m }: { m: Match }) => {
    const dc = divColor(m.division)
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
        <div style={{ width: 4, flexShrink: 0, background: dc }} />
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
                <div style={{ fontSize: 9, color: dc, fontWeight: 700, letterSpacing: 0.3, marginTop: 2 }}>{shortDiv(m.division)}</div>
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
                  <div style={{ fontSize: 9, color: dc, fontWeight: 700, letterSpacing: 0.3, marginTop: 2 }}>{shortDiv(m.division)}</div>
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

        {/* ── Hero strip ───────────────────────────────────────────────────────── */}
        {(liveItems.length > 0 || upcomingItems.length > 0) && (
          <HeroStrip liveItems={liveItems} upcomingItems={upcomingItems} C={C} isDark={isDark} now={now} />
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
                const isPerfect    = e.score === 300
                const isHighSeries = !isPerfect && (e.seriesTotal ?? 0) >= 700
                const isElite      = !isPerfect && !isHighSeries && e.score >= 250
                const isGold       = !isPerfect && !isHighSeries && e.score >= 220 && e.score < 250
                const isGood       = !isPerfect && !isHighSeries && e.score >= 200 && e.score < 220

                const nameParts = e.playerName.split(' ')
                const firstName = nameParts[0]
                const lastName  = nameParts.slice(1).join(' ')

                // ── Perfect game: Black Diamond ──────────────────────────────
                if (isPerfect) return (
                  <a key={i} href={'/matches/' + e.matchId} style={{
                    flexShrink: 0, textDecoration: 'none', borderRadius: 14,
                    padding: '14px 14px 12px', textAlign: 'center', minWidth: 90,
                    background: '#000000',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: 'inset 0 0 28px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)',
                  }}>
                    <div style={{
                      fontSize: 7, fontWeight: 900, letterSpacing: 1.8, marginBottom: 8,
                      background: 'linear-gradient(90deg, #8a98b8, #ffffff 48%, #8a98b8)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>◆ PERFECT</div>
                    <div style={{
                      fontSize: 42, fontWeight: 900, lineHeight: 1, color: '#ffffff',
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
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
                  </a>
                )

                // ── 700+ series: Muted diamond ───────────────────────────────
                if (isHighSeries) return (
                  <a key={i} href={'/matches/' + e.matchId} style={{
                    flexShrink: 0, textDecoration: 'none', borderRadius: 13,
                    padding: '12px 14px', textAlign: 'center', minWidth: 86,
                    background: '#07080e',
                    border: '1px solid rgba(255,255,255,0.11)',
                    boxShadow: 'inset 0 0 18px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.45)',
                  }}>
                    <div style={{
                      fontSize: 7, fontWeight: 800, letterSpacing: 1.5, marginBottom: 7,
                      background: 'linear-gradient(90deg, #6a7a9a, #bcc8e0 50%, #6a7a9a)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>◇ SERIE</div>
                    <div style={{
                      fontSize: 36, fontWeight: 900, lineHeight: 1, color: '#d8dff0',
                      textShadow: '0 0 8px rgba(205,218,255,0.55), 0 0 22px rgba(175,198,255,0.2)',
                    }}>{e.score}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, marginTop: 3,
                      color: 'rgba(130,150,195,0.65)' }}>{e.seriesTotal} serie</div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6,
                      color: 'rgba(195,208,235,0.8)', maxWidth: 80,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                    <div style={{ fontSize: 10, color: 'rgba(115,132,170,0.7)', maxWidth: 80,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
                  </a>
                )

                // ── Standard tiers ───────────────────────────────────────────
                const scoreColor = isElite ? '#ffffff' : isGold ? '#f5c200' : isGood ? '#4caf7d' : C.textMuted
                const scoreGlow  = isElite ? '0 0 10px rgba(0,240,255,0.4), 0 0 24px rgba(0,240,255,0.2)' : 'none'
                const cardBorder = isElite ? 'rgba(245,194,0,0.45)'
                                 : isGold  ? 'rgba(245,194,0,0.25)'
                                 : isGood  ? 'rgba(76,175,125,0.28)'
                                 : isDark  ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
                const nameParts2 = e.playerName.split(' ')
                const firstName2 = nameParts2[0]
                const lastName2  = nameParts2.slice(1).join(' ')
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
                      maxWidth: 78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName2}</div>
                    <div style={{ fontSize: 10, color: C.textMuted,
                      maxWidth: 78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName2 || ' '}</div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

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
