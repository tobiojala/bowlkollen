'use client'

import { useState, useRef } from 'react'
import { Flame, Heart, CreditCard, Swords, TrendingUp, TrendingDown, Trophy, Star, Check, Zap, Share2 } from 'lucide-react'

import { MATCHES, DNA_HIGHLIGHTS, CHALLENGES, LAST_SEASON, COLORS, ELITSERIEN_BK_RATINGS, PLAYER_BK_RATING, MOCK_FOLLOWERS, MOCK_REACTIONS, MATCH_HOME_AWAY } from './data'
import { stdDev, calcStreaks, smooth, characterSentence, calcGameAverages, rhythmLabel, narrativeParagraph } from './helpers'

import MatchSparkline   from '@/components/mockup/MatchSparkline'
import ProfileDNA       from '@/components/mockup/ProfileDNA'
import { Sheet }        from '@/components/mockup/Sheet'
import { FullCurve, MiniCurve, MCFG, type Metric } from '@/components/mockup/Curves'
import { WhatIfCard, ChallengesCard, DuellCard, CIcon } from '@/components/mockup/StatCards'
import { Surface, SectionHeader, HeroNumber, ActionRow, ActionButton, Pill, StatTile, Hairline } from '@/components/ui/primitives'

const { BG, GOLD, BLUE, GREEN, RED, BORDER } = COLORS

const INK   = '#f4f5f7'
const INK2  = 'rgba(244,245,247,0.64)'
const INK3  = 'rgba(244,245,247,0.40)'
const INK4  = 'rgba(244,245,247,0.24)'

type CardType = 'curve' | 'whatif' | 'challenges' | 'duell' | 'match'

export default function MockupPage() {
  const [expanded, setExpanded]         = useState<CardType | null>(null)
  const [curveMetric, setCurveMetric]   = useState<Metric>('snitt')
  const [curveTapped, setCurveTapped]   = useState<number | null>(null)
  const [whatIfVal, setWhatIfVal]       = useState(210)
  const [matchTapped, setMatchTapped]   = useState<number | null>(null)
  const [dnaSpoke, setDnaSpoke]         = useState<number | null>(null)
  const [dnaInfoOpen, setDnaInfoOpen]   = useState(false)
  const [activeCard, setActiveCard]     = useState(0)
  const [isLive, setIsLive]             = useState(true)
  const [following, setFollowing]       = useState(false)
  const [matchFilter, setMatchFilter]   = useState<'alla' | 'bästa' | 'hemma' | 'borta'>('alla')
  const [showOverlay, setShowOverlay]   = useState(false)
  const [showSeasonMenu, setShowSeasonMenu] = useState(false)
  const [myReactions, setMyReactions]   = useState<Set<string>>(new Set())
  const [popupMoment, setPopupMoment]   = useState<{ score: string; label: string; sub: string; iconName: string } | null>(null)
  const [momentIdx, setMomentIdx]       = useState(0)

  const DEMO_MOMENTS = [
    { score: '278',   label: 'Personbästa!',         sub: 'Högsta spel denna säsong',    iconName: 'Star'   },
    { score: '189',   label: 'Spel 3 pågår just nu', sub: 'Örebro BK 5–2 Malmö BK',      iconName: 'Flame'  },
    { score: '96%',   label: 'Utmaning nära klar!',  sub: 'Serierekord — bara 37p kvar', iconName: 'Trophy' },
    { score: '1 013', label: 'Bästa serie i år!',    sub: '+3p på säsongssnittet',       iconName: 'Star'   },
  ]

  const triggerMoment = () => {
    setPopupMoment(null)
    setTimeout(() => {
      setPopupMoment(DEMO_MOMENTS[momentIdx % DEMO_MOMENTS.length])
      setMomentIdx(i => i + 1)
      setTimeout(() => setPopupMoment(null), 4200)
    }, 50)
  }

  const toggleReaction = (matchIdx: number, type: 'flame' | 'heart', e: React.MouseEvent) => {
    e.stopPropagation()
    const key = `${matchIdx}-${type}`
    setMyReactions(prev => {
      const s = new Set(prev)
      if (s.has(key)) s.delete(key); else s.add(key)
      return s
    })
  }
  const cardRowRef = useRef<HTMLDivElement>(null)

  const liveMatch = {
    homeTeam: 'Örebro BK', awayTeam: 'Malmö BK',
    homeScore: 5, awayScore: 2,
    game: 3, totalGames: 4,
    saraGames: [201, 234],
    saraCurrentScore: 189,
  }

  const allGames    = MATCHES.flatMap(m => m.games)
  const matchAvgs   = MATCHES.map(m => Math.round(m.games.reduce((a, b) => a + b) / m.games.length))
  const seasonAvg   = Math.round(allGames.reduce((a, b) => a + b) / allGames.length)
  const bestSeries  = Math.max(...MATCHES.map(m => m.games.reduce((a, b) => a + b)))
  const over200     = allGames.filter(g => g >= 200).length
  const recent4     = MATCHES.slice(-4).flatMap(m => m.games)
  const recentAvg   = Math.round(recent4.reduce((a, b) => a + b) / recent4.length)
  const formDiff    = recentAvg - seasonAvg
  const sd          = stdDev(allGames)
  const consistency = sd < 20 ? 'Konsekvent' : sd < 30 ? 'Stabil' : sd < 40 ? 'Varierad' : 'Explosiv'
  const hitRate     = Math.round(over200 / allGames.length * 100)
  const s200        = calcStreaks(allGames, 200)
  const sAvg        = calcStreaks(allGames, seasonAvg)
  const totalSum    = allGames.reduce((a, b) => a + b)
  const projAvg     = Math.round((totalSum + whatIfVal * 4) / (allGames.length + 4))
  const projDiff    = projAvg - seasonAvg
  const gameAvgs    = calcGameAverages(MATCHES)
  const rhythm      = rhythmLabel(gameAvgs)
  const lastSeasonAvg = Math.round(LAST_SEASON.reduce((a, b) => a + b) / LAST_SEASON.length)
  const narrative     = narrativeParagraph({
    firstName: 'Sara', seasonAvg, lastSeasonAvg, formDiff, hitRate,
    streakAboveAvg: sAvg.current, consistency, rhythmLabel: rhythm.label,
    bestSeries, games200Plus: over200, totalGames: allGames.length,
  })
  const bkBelow     = ELITSERIEN_BK_RATINGS.filter(r => r < PLAYER_BK_RATING).length
  const bkTopPct    = Math.round((1 - bkBelow / ELITSERIEN_BK_RATINGS.length) * 100)

  const openMatch = (i: number) => { setMatchTapped(i); setExpanded('match') }
  const close     = () => { setExpanded(null); setCurveTapped(null); setMatchTapped(null) }

  const handleCardScroll = () => {
    if (!cardRowRef.current) return
    setActiveCard(Math.min(2, Math.round(cardRowRef.current.scrollLeft / (172 + 10))))
  }

  const tapM      = matchTapped !== null ? MATCHES[matchTapped] : null
  const curveTapM = curveTapped !== null ? MATCHES[curveTapped] : null

  // Score tone: 250+ is the gold moment, 200+ is solid, rest is quiet
  const scoreColor  = (g: number) => g >= 250 ? GOLD : g >= 200 ? INK : INK3
  const scoreWeight = (g: number) => g >= 250 ? 900 : g >= 200 ? 700 : 400

  // Distribution buckets
  const n    = allGames.length
  const bkts = [
    { c: 'rgba(244,245,247,0.18)', v: allGames.filter(g => g < 180).length,             l: 'u.180' },
    { c: 'rgba(244,245,247,0.34)', v: allGames.filter(g => g >= 180 && g < 200).length, l: '180–199' },
    { c: 'rgba(244,245,247,0.78)', v: allGames.filter(g => g >= 200 && g < 250).length, l: '200–249' },
    { c: GOLD,                     v: allGames.filter(g => g >= 250).length,            l: '250+' },
  ].filter(b => b.v > 0)

  return (
    <main style={{ minHeight: '100vh', background: BG, color: INK }}>
      <style>{`
        .noscroll::-webkit-scrollbar { display: none; }
        @keyframes dna-pulse { 0%, 100% { opacity: 0.18; } 50% { opacity: 0; } }
        .dna-hl-pulse { animation: dna-pulse 2.2s ease-in-out infinite; }
        @keyframes dna-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.018); } }
        @keyframes dna-breathe-fast { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.034); } }
        .dna-body { animation: dna-breathe 3.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
        .dna-body-hov { animation: dna-breathe-fast 2.1s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
        @keyframes challenge-urgent { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }
        .challenge-urgent { animation: challenge-urgent 1.4s ease-in-out infinite; }
        @keyframes dna-live-glow { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(245,194,0,0.2)); } 50% { transform: scale(1.022); filter: drop-shadow(0 0 12px rgba(245,194,0,0.45)); } }
        .dna-body-live { animation: dna-live-glow 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
        @keyframes live-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
        .live-dot { animation: live-dot 1s ease-in-out infinite; }
        @keyframes curtain-open { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .season-curtain { animation: curtain-open 0.15s ease-out; }
        @keyframes toast-life {
          0%   { transform: translateY(72px); opacity: 0; }
          10%  { transform: translateY(0);    opacity: 1; }
          80%  { transform: translateY(0);    opacity: 1; }
          100% { transform: translateY(72px); opacity: 0; }
        }
        .toast-card { animation: toast-life 4.2s ease forwards; }
        @keyframes count-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .hero-in { animation: count-in 0.28s cubic-bezier(0.25,0.46,0.45,0.94); }
      `}</style>

      {/* ── Demo control bar (mockup only) ── */}
      <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8,
        background: '#14171c', borderBottom: `1px solid ${BORDER}`, padding: '0 14px' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: INK4 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1 }}>DESIGNMOCKUP</span>
        <span style={{ fontSize: 11, color: INK4 }}>Spelarprofil</span>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
          {isLive && (
            <button onClick={triggerMoment}
              style={{ display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: 'rgba(244,245,247,0.08)', color: INK2, fontSize: 11, fontWeight: 600 }}>
              <Zap size={11} /> Moment
            </button>
          )}
          <button onClick={() => setIsLive(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: isLive ? 'rgba(245,194,0,0.14)' : 'rgba(244,245,247,0.08)',
              color: isLive ? GOLD : INK3, fontSize: 11, fontWeight: 700 }}>
            <div className={isLive ? 'live-dot' : undefined}
              style={{ width: 6, height: 6, borderRadius: '50%', background: isLive ? GOLD : INK4 }} />
            {isLive ? 'LIVE' : 'NORMAL'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 120 }}>

        {/* ── IDENTITY ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: '#1c2127', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: GOLD, letterSpacing: -0.5 }}>SH</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.15 }}>Sara Holmberg</div>
            <div style={{ fontSize: 13, color: INK2, marginTop: 3 }}>Örebro BK · Elitserien</div>
          </div>
          <button onClick={() => setFollowing(f => !f)}
            style={{ flexShrink: 0, minHeight: 40, padding: '0 18px', borderRadius: 999, cursor: 'pointer', border: 'none',
              background: following ? '#1c2127' : INK,
              color: following ? INK2 : BG, fontSize: 13, fontWeight: 700,
              transition: 'background 0.15s, color 0.15s' }}>
            {following ? 'Följer' : 'Följ'}
          </button>
        </div>
        <div style={{ fontSize: 13, color: INK3, padding: '8px 20px 0 82px' }}>
          <span style={{ color: INK2, fontWeight: 600 }}>{(MOCK_FOLLOWERS.followers + (following ? 1 : 0)).toLocaleString('sv-SE')}</span> följare
          <span style={{ padding: '0 6px', color: INK4 }}>·</span>
          <span style={{ color: INK2, fontWeight: 600 }}>{MOCK_FOLLOWERS.following}</span> följer
        </div>

        {/* ── HERO NUMBER ──────────────────────────────────────────────── */}
        <div className="hero-in" style={{ padding: '26px 20px 0' }}>
          <HeroNumber
            label="Säsongssnitt"
            value={seasonAvg}
            delta={formDiff}
            deltaSuffix=" form"
            caption={<>Top {bkTopPct}% i Elitserien Damer · BK Rating <span style={{ color: INK, fontWeight: 700 }}>{PLAYER_BK_RATING}</span></>}
          />
        </div>

        {/* ── ACTION ROW ───────────────────────────────────────────────── */}
        <ActionRow className="mt-6 px-4">
          <ActionButton icon={CreditCard} label="Spelarkort" />
          <ActionButton icon={Swords}     label="H2H" />
          <ActionButton icon={Trophy}     label="Utmaningar" onClick={() => setExpanded('challenges')} />
          <ActionButton icon={Share2}     label="Dela" />
        </ActionRow>

        {/* ── LIVE NOW ─────────────────────────────────────────────────── */}
        {isLive && (
          <div style={{ padding: '18px 20px 0' }}>
            <Surface level={1} className="px-4 py-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: 1 }}>LIVE</span>
                <span style={{ fontSize: 11, color: INK3 }}>Spel {liveMatch.game} av {liveMatch.totalGames}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontSize: 13, color: INK2 }}>{liveMatch.homeTeam}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: INK }}>{liveMatch.homeScore}–{liveMatch.awayScore}</span>
                  <span style={{ fontSize: 13, color: INK2 }}>{liveMatch.awayTeam}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ fontSize: 12, color: INK3 }}>Sara</span>
                {liveMatch.saraGames.map((g, i) => (
                  <span key={i} style={{ fontSize: 15, fontWeight: scoreWeight(g), color: scoreColor(g) }}>{g}</span>
                ))}
                <span style={{ fontSize: 17, fontWeight: 900, color: GOLD }}>{liveMatch.saraCurrentScore}</span>
                <span style={{ fontSize: 11, color: INK4 }}>pågår</span>
              </div>
            </Surface>
          </div>
        )}

        {/* ── DNA ──────────────────────────────────────────────────────── */}
        <div style={{ padding: '28px 20px 0' }}>
          <SectionHeader
            label="Bowling-DNA"
            right={
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowSeasonMenu(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, minHeight: 32,
                    padding: '0 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: '#1c2127' }}>
                  <span style={{ fontSize: 12, fontWeight: 600,
                    color: showOverlay ? BLUE : INK2 }}>
                    {showOverlay ? '2024/25' : '2025/26'}
                  </span>
                  <span style={{ fontSize: 9, color: INK4,
                    display: 'inline-block', transition: 'transform 0.15s',
                    transform: showSeasonMenu ? 'rotate(180deg)' : 'none' }}>▾</span>
                </button>
                {showSeasonMenu && (
                  <div className="season-curtain"
                    style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                      background: '#1c2127', borderRadius: 14, overflow: 'hidden',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.55)' }}>
                    {[
                      { value: '2025', label: '2025/26', sub: 'Aktuell säsong', color: GOLD },
                      { value: '2024', label: '2024/25', sub: 'Overlay på DNA', color: BLUE },
                    ].map((opt, i) => {
                      const active = showOverlay ? opt.value === '2024' : opt.value === '2025'
                      return (
                        <button key={opt.value}
                          onClick={e => { e.stopPropagation(); setShowOverlay(opt.value === '2024'); setShowSeasonMenu(false) }}
                          style={{ width: '100%', minWidth: 180, padding: '12px 16px',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                            borderTop: i > 0 ? `1px solid ${BORDER}` : 'none',
                            background: active ? 'rgba(244,245,247,0.05)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700,
                              color: active ? opt.color : INK2 }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize: 11, color: INK3, marginTop: 2 }}>{opt.sub}</div>
                          </div>
                          {active && (
                            <div style={{ width: 6, height: 6, borderRadius: '50%',
                              background: opt.color, flexShrink: 0 }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            }
          />
          <div style={{ width: '84%', margin: '4px auto 0' }}>
            <ProfileDNA
              matchAvgs={matchAvgs}
              overlayAvgs={showOverlay ? LAST_SEASON : undefined}
              onTapSpoke={setDnaSpoke}
              onDNATap={() => setDnaInfoOpen(true)}
              isLive={isLive}
            />
          </div>
        </div>

        {/* ── PRESTANDA ────────────────────────────────────────────────── */}
        <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionHeader label="Prestanda" />

          {/* Säsongskurva */}
          <Surface level={1} onClick={() => setExpanded('curve')} className="px-4 pt-4 pb-3">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 6 }}>SÄSONGSKURVA</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: INK, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{seasonAvg}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: formDiff > 0 ? GREEN : RED }}>
                    {formDiff > 0 ? '+' : ''}{formDiff} form
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 11, color: INK3 }}>{MATCHES.length} matcher · förra {lastSeasonAvg}</span>
            </div>
            <MiniCurve matchAvgs={matchAvgs} seasonAvg={seasonAvg} />
          </Surface>

          {/* Spelanalys: distribution + character + stats + rhythm */}
          <Surface level={1} className="px-4 py-4">
            <div style={{ display: 'flex', height: 8, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              {bkts.map((b, i) => <div key={i} style={{ flex: b.v, background: b.c, minWidth: 4 }} />)}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
              {bkts.map(b => (
                <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: b.c, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: INK3 }}>{b.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: b.c === GOLD ? GOLD : INK2, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(b.v / n * 100)}%
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: INK2, fontStyle: 'italic', lineHeight: 1.5 }}>
              {characterSentence({ hitRate, formDiff, streakAboveAvg: sAvg.current, streakAbove200: s200.current, consistency, seasonAvg, bestSeries })}
            </div>

            <Hairline className="my-4" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
              <StatTile value={seasonAvg} label="Snitt" />
              <StatTile value={formDiff > 0 ? `+${formDiff}` : formDiff} label="Form" tone={formDiff >= 0 ? 'positive' : 'negative'} />
              <StatTile value={`${hitRate}%`} label="Träff" />
              <StatTile value={consistency} label="Karaktär" />
            </div>

            <Hairline className="my-4" />

            {/* Rhythm */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                {gameAvgs.map((avg, i) => {
                  const mn    = Math.min(...gameAvgs), mx = Math.max(...gameAvgs)
                  const barH  = 10 + ((avg - mn) / (mx - mn || 1)) * 26
                  const isPeak = avg === mx
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 22, height: barH, borderRadius: 4,
                        background: isPeak ? INK : 'rgba(244,245,247,0.14)' }} />
                      <span style={{ fontSize: 11, color: isPeak ? INK2 : INK4, fontWeight: isPeak ? 700 : 400 }}>S{i + 1}</span>
                    </div>
                  )
                })}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 4 }}>RYTM</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.2 }}>{rhythm.label}</div>
                <div style={{ fontSize: 12, color: INK3, marginTop: 3 }}>{rhythm.detail}</div>
              </div>
            </div>
          </Surface>

          {/* Challenge breakout — the one gold block on the page */}
          {(() => {
            const urgent = CHALLENGES
              .filter(c => !c.done && c.progress >= 80)
              .sort((a, b) => b.progress - a.progress)[0]
            if (!urgent) return null
            return (
              <Surface level={1} onClick={() => setExpanded('challenges')} className="px-4 py-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(245,194,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CIcon name={urgent.icon} size={20} color={GOLD} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: INK }}>{urgent.title}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: GOLD, fontVariantNumeric: 'tabular-nums' }}>{urgent.progress}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(244,245,247,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                      <div className="challenge-urgent"
                        style={{ height: '100%', width: `${urgent.progress}%`, background: GOLD, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, color: INK3 }}>
                      {urgent.desc} <span style={{ color: INK2 }}>· {urgent.cur}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 16, color: INK4, flexShrink: 0 }}>›</div>
                </div>
              </Surface>
            )
          })()}

          {/* Hot streak */}
          {sAvg.current >= 4 && (
            <Surface level={1} className="px-4 py-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(93,202,165,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={20} color={GREEN} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK, letterSpacing: -0.2 }}>
                    {sAvg.current} spel i rad över snitt
                  </div>
                  <div style={{ fontSize: 12, color: INK3, marginTop: 2 }}>
                    Pågående svit — bowla idag för att hålla den vid liv
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: GREEN, lineHeight: 1, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {sAvg.current}
                </div>
              </div>
            </Surface>
          )}
        </div>

        {/* ── BERÄTTELSE ───────────────────────────────────────────────── */}
        <div style={{ padding: '28px 20px 0' }}>
          <SectionHeader label="Säsongen i korthet" />
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {narrative.map((sentence, i) => (
              <p key={i} style={{ margin: 0, lineHeight: 1.6,
                fontSize: i === 0 ? 15 : 14,
                fontWeight: i === 0 ? 500 : 400,
                color: i === 0 ? 'rgba(244,245,247,0.88)' : i < 3 ? 'rgba(244,245,247,0.6)' : 'rgba(244,245,247,0.45)' }}>
                {sentence}
              </p>
            ))}
          </div>
        </div>

        {/* ── UTFORSKA ─────────────────────────────────────────────────── */}
        <div style={{ padding: '24px 0 0' }}>
          <SectionHeader label="Utforska" className="px-5" />
          <div ref={cardRowRef} onScroll={handleCardScroll}
            className="noscroll"
            style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '12px 20px 4px', scrollbarWidth: 'none' } as React.CSSProperties}>
            <WhatIfCard     seasonAvg={seasonAvg} totalSum={totalSum}   totalGames={allGames.length} onExpand={() => setExpanded('whatif')} />
            <ChallengesCard                                                                           onExpand={() => setExpanded('challenges')} />
            <DuellCard      matchAvgs={matchAvgs}                                                     onExpand={() => setExpanded('duell')} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0 0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ height: 6, borderRadius: 3, transition: 'all 0.2s ease',
                width: i === activeCard ? 18 : 6,
                background: i === activeCard ? 'rgba(244,245,247,0.7)' : 'rgba(244,245,247,0.18)' }} />
            ))}
          </div>
        </div>

        {/* ── HISTORIK ─────────────────────────────────────────────────── */}
        <div style={{ padding: '28px 20px 0' }}>
          <SectionHeader label="Historik" />

          {/* Record chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: '#14171c' }}>
              <Trophy size={13} color={GOLD} />
              <span style={{ fontSize: 13, color: INK3 }}>Bästa serie</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{bestSeries}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: '#14171c' }}>
              <Star size={13} color={INK3} />
              <span style={{ fontSize: 13, color: INK3 }}>200+-svit</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{s200.best} spel</span>
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
            {(['alla', 'bästa', 'hemma', 'borta'] as const).map(f => (
              <Pill key={f} label={f.charAt(0).toUpperCase() + f.slice(1)}
                active={matchFilter === f} onClick={() => setMatchFilter(f)} />
            ))}
          </div>
        </div>

        {/* Match log */}
        <div style={{ marginTop: 4 }}>
          {(() => {
            const filtered = MATCHES
              .map((m, i) => ({ m, i, total: m.games.reduce((a: number, b: number) => a + b, 0) }))
              .filter(({ i }) => {
                if (matchFilter === 'hemma') return MATCH_HOME_AWAY[i] === true
                if (matchFilter === 'borta') return MATCH_HOME_AWAY[i] === false
                return true
              })
              .sort(matchFilter === 'bästa' ? (a, b) => b.total - a.total : (a, b) => b.i - a.i)
              .slice(0, matchFilter === 'bästa' ? 5 : undefined)
            return filtered.map(({ m, i, total }) => {
              const avg     = Math.round(total / m.games.length)
              const rxData  = MOCK_REACTIONS[i]
              const myFlame = myReactions.has(`${i}-flame`)
              const myHeart = myReactions.has(`${i}-heart`)
              return (
                <div key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div onClick={() => openMatch(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#14171c')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>vs {m.opp}</div>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        {m.games.map((g, gi) => (
                          <span key={gi} style={{ fontSize: 13, fontWeight: scoreWeight(g), color: scoreColor(g) }}>{g}</span>
                        ))}
                        <span style={{ marginLeft: 2 }}><MatchSparkline games={m.games} /></span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, color: m.result.startsWith('W') ? GREEN : m.result.startsWith('L') ? RED : INK3 }}>{m.result}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: avg >= seasonAvg ? INK : INK3, fontVariantNumeric: 'tabular-nums' }}>{total}</div>
                    </div>
                  </div>
                  {rxData && (
                    <div style={{ display: 'flex', gap: 8, padding: '0 20px 10px' }}>
                      {[
                        { type: 'flame' as const, Icon: Flame, my: myFlame, count: (rxData?.flame ?? 0) + (myFlame ? 1 : 0), color: '#f5a623' },
                        { type: 'heart' as const, Icon: Heart, my: myHeart, count: (rxData?.heart ?? 0) + (myHeart ? 1 : 0), color: RED },
                      ].map(({ type, Icon, my, count, color }) => (
                        <button key={type} onClick={e => toggleReaction(i, type, e)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6,
                            padding: '0 16px', minHeight: 40, borderRadius: 999, border: 'none', cursor: 'pointer',
                            background: my ? `${color}1f` : '#14171c' }}>
                          <Icon size={14} color={my ? color : INK3} fill={my ? color : 'none'} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: my ? color : INK3, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          })()}
        </div>
      </div>

      {/* ── Moment toast ── */}
      {popupMoment && (
        <div key={momentIdx} className="toast-card"
          style={{ position: 'fixed', bottom: 88, left: 0, right: 0, zIndex: 200,
            display: 'flex', justifyContent: 'center', padding: '0 20px',
            pointerEvents: 'none' }}>
          <div style={{ width: '100%', maxWidth: 560, borderRadius: 20,
            background: '#1c2127',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flexShrink: 0, textAlign: 'center',
                minWidth: 64, background: 'rgba(245,194,0,0.1)', borderRadius: 14,
                padding: '10px 10px' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: GOLD,
                  lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {popupMoment.score}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: INK,
                  lineHeight: 1.2, marginBottom: 4 }}>
                  {popupMoment.label}
                </div>
                <div style={{ fontSize: 13, color: INK3 }}>{popupMoment.sub}</div>
              </div>
              <CIcon name={popupMoment.iconName} size={22} color={GOLD} />
            </div>
          </div>
        </div>
      )}

      {/* ── Expanded sheets ── */}

      {expanded === 'curve' && (
        <Sheet title="SÄSONGSKURVA" onClose={close}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {(Object.keys(MCFG) as Metric[]).map(m => (
              <button key={m} onClick={() => setCurveMetric(m)}
                style={{ flex: 1, minHeight: 40, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: curveMetric === m ? `${MCFG[m].color}1c` : 'rgba(244,245,247,0.05)',
                  color: curveMetric === m ? MCFG[m].color : INK3 }}>
                {MCFG[m].label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>{seasonAvg} <span style={{ fontSize: 13, color: INK3, fontWeight: 400 }}>snitt</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: formDiff > 0 ? GREEN : RED }}>
              {formDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(formDiff)} p senaste 4 matcher
            </div>
          </div>
          <FullCurve matchAvgs={matchAvgs} seasonAvg={seasonAvg} metric={curveMetric} tapped={curveTapped} onTap={setCurveTapped} />
          {curveMetric === 'snitt' && (
            <div style={{ fontSize: 11, color: INK4, textAlign: 'center', marginTop: 8 }}>Tryck på en punkt för matchinfo</div>
          )}
          {curveTapM && (
            <div style={{ marginTop: 16, padding: '14px', background: 'rgba(244,245,247,0.04)', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>vs {curveTapM.opp}</div>
                  <div style={{ fontSize: 11, color: INK3 }}>{curveTapM.date}</div>
                </div>
                <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  color: curveTapM.result.startsWith('W') ? GREEN : curveTapM.result.startsWith('L') ? RED : INK3,
                  background: curveTapM.result.startsWith('W') ? 'rgba(93,202,165,0.12)' : curveTapM.result.startsWith('L') ? 'rgba(224,85,85,0.12)' : 'rgba(244,245,247,0.06)' }}>
                  {curveTapM.result}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {curveTapM.games.map((g, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'rgba(244,245,247,0.04)', borderRadius: 10 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor(g), fontVariantNumeric: 'tabular-nums' }}>{g}</div>
                    <div style={{ fontSize: 11, color: INK3, marginTop: 3 }}>S{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Sheet>
      )}

      {expanded === 'whatif' && (
        <Sheet title="VAD HÄNDER OM..." onClose={close}>
          <div style={{ fontSize: 13, color: INK3, marginBottom: 24 }}>Dra reglaget — se hur nästa match påverkar ditt snitt</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 12, color: INK3, marginBottom: 4 }}>Du snittade</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: INK, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{whatIfVal}</div>
              <div style={{ fontSize: 12, color: INK3, marginTop: 4 }}>i nästa match</div>
            </div>
            <div style={{ fontSize: 28, color: INK4, fontWeight: 300 }}>→</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: INK3, marginBottom: 4 }}>Nytt säsongssnitt</div>
              <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: projDiff > 0 ? GREEN : projDiff < 0 ? RED : INK3 }}>{projAvg}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                {projDiff > 0 ? <TrendingUp size={14} color={GREEN} /> : projDiff < 0 ? <TrendingDown size={14} color={RED} /> : null}
                <span style={{ fontSize: 14, fontWeight: 700, color: projDiff > 0 ? GREEN : projDiff < 0 ? RED : INK3 }}>
                  {projDiff > 0 ? `+${projDiff}` : projDiff < 0 ? projDiff : 'oförändrat'}
                </span>
              </div>
            </div>
          </div>
          <input type="range" min="140" max="280" step="5" value={whatIfVal}
            onChange={e => setWhatIfVal(Number(e.target.value))}
            style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: INK3, marginTop: 6 }}>
            <span>140</span><span style={{ color: INK2, fontWeight: 600 }}>Ditt snitt: {seasonAvg}</span><span>280</span>
          </div>
        </Sheet>
      )}

      {expanded === 'challenges' && (
        <Sheet title="UTMANINGAR" onClose={close}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CHALLENGES.map((c, i) => (
              <div key={i} style={{ background: 'rgba(244,245,247,0.04)', borderRadius: 16, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: c.done ? 0 : 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: c.done ? 'rgba(93,202,165,0.15)' : c.progress >= 85 ? 'rgba(245,194,0,0.12)' : 'rgba(244,245,247,0.05)' }}>
                    <CIcon name={c.icon} size={18} color={c.done ? GREEN : c.progress >= 85 ? GOLD : INK2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.done ? GREEN : INK }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: INK3, marginTop: 2 }}>{c.desc}</div>
                  </div>
                  {c.done && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: GREEN, padding: '4px 11px', borderRadius: 20, background: 'rgba(93,202,165,0.15)', flexShrink: 0 }}>
                      <Check size={11} /> Klar
                    </div>
                  )}
                </div>
                {!c.done && (
                  <>
                    <div style={{ height: 5, background: 'rgba(244,245,247,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                      <div className={c.progress >= 85 ? 'challenge-urgent' : undefined}
                        style={{ height: '100%', width: `${c.progress}%`, background: GOLD, borderRadius: 4 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: INK3 }}>{c.cur}</span>
                      <span style={{ fontSize: 12, color: c.progress >= 85 ? GOLD : INK3, fontWeight: c.progress >= 85 ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{c.progress}%</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </Sheet>
      )}

      {expanded === 'duell' && (() => {
        const W = 320, H = 110, PAD = { l: 28, r: 42, t: 10, b: 20 }
        const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b
        const all = [...matchAvgs, ...LAST_SEASON]
        const mnV = Math.floor(Math.min(...all) / 10) * 10 - 5, mxV = Math.ceil(Math.max(...all) / 10) * 10 + 5
        const cx = (i: number) => PAD.l + (i / (matchAvgs.length - 1)) * iW
        const cy = (v: number) => PAD.t + iH - ((v - mnV) / (mxV - mnV)) * iH
        const thisPts = matchAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
        const lastPts = LAST_SEASON.map((v, i) => ({ x: cx(i), y: cy(v) }))
        const thisAvg = Math.round(matchAvgs.reduce((a, b) => a + b) / matchAvgs.length)
        const lastAvg = Math.round(LAST_SEASON.reduce((a, b) => a + b) / LAST_SEASON.length)
        return (
          <Sheet title="SÄSONGSDUELL" onClose={close}>
            <div style={{ fontSize: 13, color: INK3, marginBottom: 16 }}>Den här säsongen vs förra säsongen</div>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
              <path d={smooth(lastPts)} fill="none" stroke="rgba(244,245,247,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,3" />
              <path d={smooth(thisPts)} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={thisPts[thisPts.length-1].x} cy={thisPts[thisPts.length-1].y} r={5} fill={GOLD} stroke="rgba(245,194,0,0.3)" strokeWidth="5" />
              <circle cx={lastPts[lastPts.length-1].x} cy={lastPts[lastPts.length-1].y} r={3} fill="rgba(244,245,247,0.35)" />
              <text x={W - PAD.r + 4} y={cy(matchAvgs[matchAvgs.length-1]) + 4} fill={GOLD} fontSize="8" fontWeight="bold">i år</text>
              <text x={W - PAD.r + 4} y={cy(LAST_SEASON[LAST_SEASON.length-1]) + 4} fill="rgba(244,245,247,0.5)" fontSize="8">förra</text>
              <text x={PAD.l} y={H - 3} fill="rgba(244,245,247,0.22)" fontSize="8" textAnchor="middle">{MATCHES[0].date}</text>
              <text x={W - PAD.r} y={H - 3} fill="rgba(244,245,247,0.22)" fontSize="8" textAnchor="end">{MATCHES[MATCHES.length-1].date}</text>
            </svg>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(245,194,0,0.08)', borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: GOLD, fontVariantNumeric: 'tabular-nums' }}>{thisAvg}</div>
                <div style={{ fontSize: 11, color: INK3, marginTop: 3, letterSpacing: 1 }}>DENNA SÄSONG</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 52, gap: 2 }}>
                <TrendingUp size={16} color={GREEN} />
                <div style={{ fontSize: 16, fontWeight: 900, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>{thisAvg - lastAvg}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(244,245,247,0.04)', borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'rgba(244,245,247,0.5)', fontVariantNumeric: 'tabular-nums' }}>{lastAvg}</div>
                <div style={{ fontSize: 11, color: INK3, marginTop: 3, letterSpacing: 1 }}>FÖRRA SÄSONGEN</div>
              </div>
            </div>
          </Sheet>
        )
      })()}

      {expanded === 'match' && tapM && (
        <Sheet title="MATCHDETALJER" onClose={close}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>vs {tapM.opp}</div>
              <div style={{ fontSize: 12, color: INK3, marginTop: 3 }}>{tapM.date}</div>
            </div>
            <div style={{ padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: tapM.result.startsWith('W') ? 'rgba(93,202,165,0.15)' : tapM.result.startsWith('L') ? 'rgba(224,85,85,0.15)' : 'rgba(244,245,247,0.08)',
              color: tapM.result.startsWith('W') ? GREEN : tapM.result.startsWith('L') ? RED : INK3 }}>
              {tapM.result}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {tapM.games.map((g, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 4px',
                background: g >= 250 ? 'rgba(245,194,0,0.08)' : 'rgba(244,245,247,0.04)',
                borderRadius: 14 }}>
                <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: scoreColor(g), fontVariantNumeric: 'tabular-nums' }}>{g}</div>
                <div style={{ fontSize: 11, color: INK3, marginTop: 5 }}>Spel {i + 1}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ l: 'TOTALT', v: tapM.games.reduce((a, b) => a + b) }, { l: 'MATCHSNITT', v: Math.round(tapM.games.reduce((a, b) => a + b) / tapM.games.length) }].map(s => (
              <div key={s.l} style={{ textAlign: 'center', padding: '12px', background: 'rgba(244,245,247,0.04)', borderRadius: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                <div style={{ fontSize: 11, color: INK3, marginTop: 3, letterSpacing: 1 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </Sheet>
      )}

      {dnaSpoke !== null && (() => {
        const m   = MATCHES[dnaSpoke]
        const hl  = DNA_HIGHLIGHTS.find(h => h.idx === dnaSpoke)
        const total = m.games.reduce((a, b) => a + b)
        const avg   = Math.round(total / m.games.length)
        return (
          <Sheet title="DNA — MATCHDETALJ" onClose={() => setDnaSpoke(null)}>
            {hl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, marginBottom: 20, background: `${hl.color}14` }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${hl.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CIcon name={hl.iconName} size={20} color={hl.color} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: hl.color }}>{hl.label}</div>
                  {hl.sublabel && <div style={{ fontSize: 12, color: INK3, marginTop: 2 }}>{hl.sublabel}</div>}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>vs {m.opp}</div>
                <div style={{ fontSize: 12, color: INK3, marginTop: 3 }}>{m.date}</div>
              </div>
              <div style={{ padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: m.result.startsWith('W') ? 'rgba(93,202,165,0.15)' : m.result.startsWith('L') ? 'rgba(224,85,85,0.15)' : 'rgba(244,245,247,0.08)',
                color: m.result.startsWith('W') ? GREEN : m.result.startsWith('L') ? RED : INK3 }}>
                {m.result}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {m.games.map((g, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 4px',
                  background: g >= 250 ? 'rgba(245,194,0,0.08)' : 'rgba(244,245,247,0.04)',
                  borderRadius: 14 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: scoreColor(g), fontVariantNumeric: 'tabular-nums' }}>{g}</div>
                  <div style={{ fontSize: 11, color: INK3, marginTop: 5 }}>Spel {i + 1}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[{ l: 'TOTALT', v: total }, { l: 'MATCHSNITT', v: avg }].map(s => (
                <div key={s.l} style={{ textAlign: 'center', padding: '12px', background: 'rgba(244,245,247,0.04)', borderRadius: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: INK3, marginTop: 3, letterSpacing: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(244,245,247,0.03)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: INK3 }}>Match {dnaSpoke + 1} av {MATCHES.length} denna säsong</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {avg >= seasonAvg ? <TrendingUp size={12} color={GREEN} /> : <TrendingDown size={12} color={RED} />}
                <span style={{ fontSize: 12, fontWeight: 700, color: avg >= seasonAvg ? GREEN : RED }}>
                  {avg >= seasonAvg ? `+${avg - seasonAvg}p` : `${avg - seasonAvg}p`} vs snitt
                </span>
              </div>
            </div>
          </Sheet>
        )
      })()}

      {dnaInfoOpen && (() => {
        const S = 280, LCX = S / 2, LCY = S / 2
        const lmn = Math.min(...matchAvgs), lmx = Math.max(...matchAvgs)
        const lSpokes = matchAvgs.map((avg, i) => {
          const angle = (2 * Math.PI * i / matchAvgs.length) - Math.PI / 2
          const r = 32 + ((avg - lmn) / (lmx === lmn ? 1 : lmx - lmn)) * 98
          return { x: LCX + r * Math.cos(angle), y: LCY + r * Math.sin(angle), r, angle }
        })
        const lPath    = lSpokes.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
        const bestIdx  = matchAvgs.indexOf(Math.max(...matchAvgs))
        const worstIdx = matchAvgs.indexOf(Math.min(...matchAvgs))
        return (
          <Sheet title="BOWLING DNA" onClose={() => setDnaInfoOpen(false)}>
            <div style={{ fontSize: 13, color: INK3, marginBottom: 22, lineHeight: 1.75 }}>
              Ditt DNA är ett <span style={{ color: INK, fontWeight: 600 }}>unikt avtryck</span> skapat från dina {MATCHES.length} matcher denna säsong.
              Varje av de {MATCHES.length} spetsarna representerar en match. Ju längre spetsen, desto bättre var din form den dagen.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
              <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} className="dna-body" style={{ display: 'block' }}>
                <defs>
                  <radialGradient id="li_g" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(245,194,0,0.22)" />
                    <stop offset="100%" stopColor="rgba(245,194,0,0.03)" />
                  </radialGradient>
                  <filter id="li_glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {[32, 65, 98, 130].map(r => (
                  <circle key={r} cx={LCX} cy={LCY} r={r} fill="none" stroke="rgba(244,245,247,0.07)" strokeWidth="1" />
                ))}
                {lSpokes.map((p, i) => (
                  <line key={i} x1={LCX} y1={LCY} x2={p.x} y2={p.y} stroke="rgba(244,245,247,0.05)" strokeWidth="1" />
                ))}
                <path d={lPath} fill="url(#li_g)" filter="url(#li_glow)" />
                <path d={lPath} fill="none" stroke="rgba(245,194,0,0.72)" strokeWidth="2" />
                {lSpokes.map((p, i) => {
                  const isBest  = i === bestIdx
                  const isWorst = i === worstIdx
                  const hl2     = DNA_HIGHLIGHTS.find(h => h.idx === i)
                  const color   = hl2 ? hl2.color : isBest ? GOLD : isWorst ? 'rgba(244,245,247,0.4)' : 'rgba(245,194,0,0.6)'
                  const r       = hl2 || isBest ? 6 : isWorst ? 4 : 3
                  return <circle key={i} cx={p.x} cy={p.y} r={r} fill={color} />
                })}
                {[bestIdx, worstIdx].map((idx, li) => {
                  const p      = lSpokes[idx]
                  const angle  = (2 * Math.PI * idx / matchAvgs.length) - Math.PI / 2
                  const lx     = LCX + (p.r + 18) * Math.cos(angle)
                  const ly     = LCY + (p.r + 18) * Math.sin(angle)
                  const anchor: 'start' | 'end' | 'middle' = Math.cos(angle) > 0.25 ? 'start' : Math.cos(angle) < -0.25 ? 'end' : 'middle'
                  return (
                    <text key={li} x={lx} y={ly + 4} fill={li === 0 ? GOLD : 'rgba(244,245,247,0.4)'}
                      fontSize="10" fontWeight="700" textAnchor={anchor}>
                      {li === 0 ? 'Bäst' : 'Lägst'}
                    </text>
                  )
                })}
                <circle cx={LCX} cy={LCY} r={26} fill="#0b0d10" stroke="rgba(245,194,0,0.35)" strokeWidth="1.5" />
                <text x={LCX} y={LCY + 5} fill={GOLD} fontSize="13" fontWeight="900" textAnchor="middle">SH</text>
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { l: 'BÄSTA FORM',  v: `${Math.max(...matchAvgs)}`, sub: 'snitt en match', c: GOLD },
                { l: 'LÄGSTA FORM', v: `${Math.min(...matchAvgs)}`, sub: 'snitt en match', c: INK3 },
                { l: 'SPANN',       v: `${Math.max(...matchAvgs) - Math.min(...matchAvgs)}p`, sub: 'variation', c: INK },
              ].map(s => (
                <div key={s.l} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', background: 'rgba(244,245,247,0.04)', borderRadius: 14 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.c, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: INK3, marginTop: 5 }}>{s.l}</div>
                  <div style={{ fontSize: 11, color: INK4, marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(244,245,247,0.03)', borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: INK2, lineHeight: 1.65 }}>
                Tryck på en spets i profilen för att se matchdetaljerna — poäng, motståndare och hur du presterade jämfört med ditt snitt.
              </div>
            </div>
          </Sheet>
        )
      })()}
    </main>
  )
}
