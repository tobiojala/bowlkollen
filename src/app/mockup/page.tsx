'use client'

import { useState, useRef } from 'react'
import { Flame, Heart, CreditCard, Swords, TrendingUp, TrendingDown, Trophy, Star, Check, Zap } from 'lucide-react'

import { MATCHES, DNA_HIGHLIGHTS, CHALLENGES, LAST_SEASON, COLORS, ELITSERIEN_BK_RATINGS, PLAYER_BK_RATING, MOCK_FOLLOWERS, MOCK_REACTIONS, MATCH_HOME_AWAY } from './data'
import { stdDev, calcStreaks, smooth, characterSentence, calcGameAverages, rhythmLabel, narrativeParagraph } from './helpers'

import MatchSparkline   from '@/components/mockup/MatchSparkline'
import ProfileDNA       from '@/components/mockup/ProfileDNA'
import { Sheet }        from '@/components/mockup/Sheet'
import { FullCurve, MiniCurve, MCFG, type Metric } from '@/components/mockup/Curves'
import { WhatIfCard, ChallengesCard, DuellCard, CIcon } from '@/components/mockup/StatCards'

const { BG, GOLD, BLUE, GREEN, MUTED, BORDER } = COLORS

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
    { score: '278',   label: 'Personbästa!',        sub: 'Högsta spel denna säsong',   iconName: 'Star'   },
    { score: '189',   label: 'Spel 3 pågår just nu', sub: 'Örebro BK 5–2 Malmö BK',   iconName: 'Flame'  },
    { score: '96%',   label: 'Utmaning nära klar!',  sub: 'Serierekord — bara 37p kvar', iconName: 'Trophy' },
    { score: '1 013', label: 'Bästa serie i år!',    sub: '+3p på säsongssnittet',      iconName: 'Star'   },
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
    setMyReactions(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
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
  const bkBarPct    = Math.round(bkBelow / ELITSERIEN_BK_RATINGS.length * 100)

  const openMatch = (i: number) => { setMatchTapped(i); setExpanded('match') }
  const close     = () => { setExpanded(null); setCurveTapped(null); setMatchTapped(null) }

  const handleCardScroll = () => {
    if (!cardRowRef.current) return
    setActiveCard(Math.min(3, Math.round(cardRowRef.current.scrollLeft / (172 + 10))))
  }

  const tapM      = matchTapped !== null ? MATCHES[matchTapped] : null
  const curveTapM = curveTapped !== null ? MATCHES[curveTapped] : null

  // Distribution buckets
  const n    = allGames.length
  const bkts = [
    { c: 'rgba(140,155,180,0.42)', v: allGames.filter(g => g < 180).length,             l: 'u.180' },
    { c: 'rgba(160,175,200,0.65)', v: allGames.filter(g => g >= 180 && g < 200).length, l: '180–199' },
    { c: GOLD,                     v: allGames.filter(g => g >= 200 && g < 250).length, l: '200–249' },
    { c: BLUE,                     v: allGames.filter(g => g >= 250).length,            l: '250+' },
  ].filter(b => b.v > 0)

  return (
    <main style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, sans-serif', color: 'white' }}>
      <style>{`
        .noscroll::-webkit-scrollbar { display: none; }
        @keyframes dna-pulse { 0%, 100% { opacity: 0.18; } 50% { opacity: 0; } }
        .dna-hl-pulse { animation: dna-pulse 2.2s ease-in-out infinite; }
        @keyframes dna-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.018); } }
        @keyframes dna-breathe-fast { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.034); } }
        .dna-body { animation: dna-breathe 3.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
        .dna-body-hov { animation: dna-breathe-fast 2.1s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
        @keyframes streak-ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,194,0,0.5); } 65% { box-shadow: 0 0 0 8px rgba(245,194,0,0); } }
        .streak-icon { animation: streak-ring 2s ease-in-out infinite; }
        @keyframes challenge-urgent { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }
        .challenge-urgent { animation: challenge-urgent 1.4s ease-in-out infinite; }
        @keyframes dna-live-glow { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(245,194,0,0.3)); } 50% { transform: scale(1.026); filter: drop-shadow(0 0 18px rgba(245,194,0,0.65)); } }
        .dna-body-live { animation: dna-live-glow 1.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
        @keyframes live-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
        .live-dot { animation: live-dot 1s ease-in-out infinite; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-track { display: flex; animation: ticker 22s linear infinite; white-space: nowrap; }
        @keyframes curtain-open { from { opacity: 0; transform: translateX(-50%) translateY(-6px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .season-curtain { animation: curtain-open 0.15s ease-out; }
        @keyframes toast-life {
          0%   { transform: translateY(72px); opacity: 0; }
          10%  { transform: translateY(0);    opacity: 1; }
          80%  { transform: translateY(0);    opacity: 1; }
          100% { transform: translateY(72px); opacity: 0; }
        }
        .toast-card { animation: toast-life 4.2s ease forwards; }
      `}</style>

      {/* Banner — live ticker or design label */}
      <div style={{ height: 38, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden',
        background: isLive ? 'rgba(245,194,0,0.08)' : 'rgba(245,194,0,0.07)',
        borderBottom: `1px solid ${isLive ? 'rgba(245,194,0,0.25)' : 'rgba(245,194,0,0.18)'}` }}>
        {isLive ? (
          /* Scrolling ticker */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 14, flexShrink: 0, zIndex: 1 }}>
              <div className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, boxShadow: `0 0 5px ${GOLD}` }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: 1.2 }}>LIVE</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              {(() => {
                const seg = (kp: string) => (
                  <span key={kp} style={{ display: 'inline-flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: 'rgba(255,255,255,0.18)', padding: '0 10px' }}>·</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Örebro BK</span>
                    <span style={{ color: 'white', fontWeight: 900, fontSize: 14, margin: '0 7px', lineHeight: 1 }}>{liveMatch.homeScore}</span>
                    <span style={{ color: 'rgba(255,255,255,0.22)', fontWeight: 300, fontSize: 11 }}>–</span>
                    <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 700, fontSize: 14, margin: '0 7px', lineHeight: 1 }}>{liveMatch.awayScore}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Malmö BK</span>
                    <span style={{ color: 'rgba(255,255,255,0.18)', padding: '0 10px' }}>·</span>
                    <span style={{ color: 'rgba(255,255,255,0.32)', fontSize: 10 }}>Spel </span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 800, fontSize: 11, marginLeft: 3 }}>{liveMatch.game}/{liveMatch.totalGames}</span>
                    <span style={{ color: 'rgba(255,255,255,0.18)', padding: '0 10px' }}>·</span>
                    <span style={{ color: 'rgba(255,255,255,0.32)', fontSize: 10, marginRight: 7 }}>Sara</span>
                    {liveMatch.saraGames.map((g, i) => (
                      <span key={`${kp}-${i}`}
                        style={{ color: g >= 200 ? GOLD : 'rgba(255,255,255,0.65)',
                          fontWeight: g >= 200 ? 800 : 500, fontSize: 12, marginRight: 8 }}>
                        {g}
                      </span>
                    ))}
                    <span style={{ color: GOLD, fontWeight: 900, fontSize: 13 }}>{liveMatch.saraCurrentScore}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600, marginLeft: 3, letterSpacing: 0.5 }}>pågår</span>
                    <span style={{ color: 'rgba(255,255,255,0.18)', padding: '0 10px' }}>·</span>
                  </span>
                )
                return (
                  <div className="ticker-track" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {seg('a')}{seg('b')}
                  </div>
                )
              })()}
            </div>
          </>
        ) : (
          /* Static label */
          <>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, marginLeft: 14 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>DESIGNMOCKUP</span>
            <span style={{ fontSize: 11, color: 'rgba(245,194,0,0.48)' }}>Spelarprofil</span>
          </>
        )}
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', paddingRight: 12, flexShrink: 0 }}>
          {isLive && (
            <button onClick={triggerMoment}
              style={{ display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>
              <Zap size={11} /> Moment
            </button>
          )}
          <button onClick={() => setIsLive(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: isLive ? 'rgba(245,194,0,0.2)' : 'rgba(255,255,255,0.07)',
              color: isLive ? GOLD : 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700 }}>
            <div className={isLive ? 'live-dot' : undefined}
              style={{ width: 6, height: 6, borderRadius: '50%', background: isLive ? GOLD : 'rgba(255,255,255,0.3)' }} />
            {isLive ? 'LIVE' : 'NORMAL'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 120 }}>

        {/* ── IDENTITY ───────────────────────────────────────────────────────── */}

        {/* DNA header — label + season selector on the same line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, paddingTop: 14, paddingBottom: 2, position: 'relative' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)', letterSpacing: 2.4 }}>
            DITT DNA
          </span>

          {/* Season dropdown trigger */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSeasonMenu(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: showOverlay ? 'rgba(122,180,232,0.12)' : 'rgba(255,255,255,0.07)',
                outline: `1px solid ${showOverlay ? 'rgba(122,180,232,0.25)' : 'rgba(255,255,255,0.1)'}` }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
                color: showOverlay ? BLUE : 'rgba(255,255,255,0.45)' }}>
                {showOverlay ? '2024/25' : '2025/26'}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)',
                display: 'inline-block', transition: 'transform 0.15s',
                transform: showSeasonMenu ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>

            {/* Curtain panel */}
            {showSeasonMenu && (
              <div className="season-curtain"
                style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
                  transform: 'translateX(-50%)', zIndex: 50,
                  background: '#172030', borderRadius: 14, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.55)' }}>
                {[
                  { value: '2025', label: '2025/26', sub: 'Aktuell säsong', color: GOLD },
                  { value: '2024', label: '2024/25', sub: 'Overlay på DNA', color: BLUE },
                ].map((opt, i) => {
                  const active = showOverlay ? opt.value === '2024' : opt.value === '2025'
                  return (
                    <button key={opt.value}
                      onClick={e => { e.stopPropagation(); setShowOverlay(opt.value === '2024'); setShowSeasonMenu(false) }}
                      style={{ width: '100%', minWidth: 180, padding: '11px 16px',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        borderTop: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                        background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700,
                          color: active ? opt.color : 'rgba(255,255,255,0.65)' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{opt.sub}</div>
                      </div>
                      {active && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%',
                          background: opt.color, flexShrink: 0,
                          boxShadow: `0 0 6px ${opt.color}` }} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* DNA hero */}
        <ProfileDNA
          matchAvgs={matchAvgs}
          overlayAvgs={showOverlay ? LAST_SEASON : undefined}
          onTapSpoke={setDnaSpoke}
          onDNATap={() => setDnaInfoOpen(true)}
          isLive={isLive}
        />

        {/* Name + info + buttons */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3, lineHeight: 1.2 }}>Sara Holmberg</div>
            <button onClick={() => setFollowing(f => !f)}
              style={{ marginTop: 4, flexShrink: 0, padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                background: following ? 'rgba(255,255,255,0.06)' : 'rgba(93,202,165,0.12)',
                color: following ? MUTED : GREEN, fontSize: 11, fontWeight: 700,
                border: `1px solid ${following ? 'rgba(255,255,255,0.12)' : 'rgba(93,202,165,0.35)'}` }}>
              {following ? 'Följer ✓' : '+ Följ'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
            {(MOCK_FOLLOWERS.followers + (following ? 1 : 0)).toLocaleString('sv-SE')} följare · {MOCK_FOLLOWERS.following} följer
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Örebro BK · Elitserien</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, padding: '3px 9px', borderRadius: 20, background: 'rgba(93,202,165,0.10)', border: '1px solid rgba(93,202,165,0.35)', color: GREEN }}>PRO</span>
          </div>

          {/* BK Rating percentile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12,
            padding: '10px 14px', borderRadius: 14,
            background: 'rgba(93,202,165,0.06)', border: '1px solid rgba(93,202,165,0.18)' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: MUTED, letterSpacing: 1, marginBottom: 2 }}>BK RATING</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: GREEN, lineHeight: 1 }}>{PLAYER_BK_RATING}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ position: 'relative', height: 6, borderRadius: 3,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.07) 0%, rgba(93,202,165,0.4) 100%)' }}>
                <div style={{
                  position: 'absolute', top: '50%', left: `${bkBarPct}%`,
                  width: 13, height: 13, borderRadius: '50%',
                  background: GREEN, transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 10px rgba(93,202,165,0.7)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>Lägst</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>Högst</span>
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: GREEN, lineHeight: 1 }}>Top {bkTopPct}%</div>
              <div style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>i Elitserien Damer</div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={{ flex: 1, padding: '9px 0', borderRadius: 20, border: `1px solid rgba(93,202,165,0.35)`, background: 'rgba(93,202,165,0.10)', color: GREEN, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <CreditCard size={15} /> Spelarkort
            </button>
            <button style={{ flex: 1, padding: '9px 0', borderRadius: 20, border: '1px solid rgba(245,194,0,0.30)', background: 'rgba(245,194,0,0.08)', color: GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Swords size={15} /> H2H
            </button>
          </div>

          {/* ── PRESTANDA ───────────────────────────────────────────────── */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.8 }}>PRESTANDA</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Promoted Säsongskurva */}
          <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, padding: '14px 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: MUTED, letterSpacing: 1, marginBottom: 4 }}>SÄSONGSKURVA</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{seasonAvg}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: formDiff > 0 ? GREEN : '#e05555' }}>
                    {formDiff > 0 ? '+' : ''}{formDiff} form
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 9, color: MUTED }}>{MATCHES.length} matcher · förra {lastSeasonAvg}</span>
            </div>
            <MiniCurve matchAvgs={matchAvgs} seasonAvg={seasonAvg} />
          </div>

          {/* Distribution + stats */}
          <div style={{ marginTop: 16, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', height: 10, borderRadius: 8, overflow: 'hidden', gap: 2 }}>
              {bkts.map((b, i) => <div key={i} style={{ flex: b.v, background: b.c, minWidth: 4 }} />)}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
              {bkts.map(b => (
                <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: b.c, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: MUTED }}>{b.l}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: b.c === GOLD ? GOLD : b.c === BLUE ? BLUE : 'rgba(255,255,255,0.55)' }}>
                    {Math.round(b.v / n * 100)}%
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', lineHeight: 1.5 }}>
              {characterSentence({ hitRate, formDiff, streakAboveAvg: sAvg.current, streakAbove200: s200.current, consistency, seasonAvg, bestSeries })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginTop: 14, gap: 4 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>{seasonAvg}</div>
                <div style={{ fontSize: 8, color: MUTED, marginTop: 3, letterSpacing: 1 }}>SNITT</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: formDiff > 0 ? GREEN : '#e05555' }}>
                  {formDiff > 0 ? `+${formDiff}` : formDiff}
                </div>
                <div style={{ fontSize: 8, color: MUTED, marginTop: 3, letterSpacing: 1 }}>FORM</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{hitRate}%</div>
                <div style={{ fontSize: 8, color: MUTED, marginTop: 3, letterSpacing: 1 }}>TRÄFF</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>{consistency}</div>
                <div style={{ fontSize: 8, color: MUTED, marginTop: 4, letterSpacing: 1 }}>KARAKTÄR</div>
              </div>
            </div>

            {/* Rhythm arc */}
            <div style={{ marginTop: 14, paddingTop: 12,
              borderTop: `1px solid rgba(255,255,255,0.06)`,
              display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                {gameAvgs.map((avg, i) => {
                  const mn    = Math.min(...gameAvgs), mx = Math.max(...gameAvgs)
                  const barH  = 10 + ((avg - mn) / (mx - mn || 1)) * 26
                  const isPeak = avg === mx
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 22, height: barH, borderRadius: 4,
                        background: isPeak ? GOLD : 'rgba(255,255,255,0.15)',
                        boxShadow: isPeak ? '0 0 8px rgba(245,194,0,0.4)' : undefined }} />
                      <span style={{ fontSize: 8, color: isPeak ? GOLD : MUTED, fontWeight: isPeak ? 700 : 400 }}>S{i + 1}</span>
                    </div>
                  )
                })}
              </div>
              <div>
                <div style={{ fontSize: 8, fontWeight: 800, color: MUTED, letterSpacing: 1.2, marginBottom: 4 }}>RYTM</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: GREEN, lineHeight: 1.2 }}>{rhythm.label}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{rhythm.detail}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge breakout — surfaces highest near-complete challenge */}
        {(() => {
          const urgent = CHALLENGES
            .filter(c => !c.done && c.progress >= 80)
            .sort((a, b) => b.progress - a.progress)[0]
          if (!urgent) return null
          return (
            <div onClick={() => setExpanded('challenges')}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                cursor: 'pointer', background: 'rgba(245,194,0,0.06)',
                borderTop: '1px solid rgba(245,194,0,0.12)',
                borderBottom: '1px solid rgba(245,194,0,0.12)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(245,194,0,0.12)', border: '1px solid rgba(245,194,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CIcon name={urgent.icon} size={20} color={GOLD} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, letterSpacing: 1.2 }}>UTMANING NÄRA KLAR</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: GOLD,
                    background: 'rgba(245,194,0,0.15)', border: '1px solid rgba(245,194,0,0.3)',
                    padding: '1px 6px', borderRadius: 8 }}>{urgent.progress}%</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 6 }}>{urgent.title}</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 5 }}>
                  <div className="challenge-urgent"
                    style={{ height: '100%', width: `${urgent.progress}%`,
                      background: 'linear-gradient(90deg, rgba(245,194,0,0.6), #f5c200)',
                      borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: MUTED }}>
                  {urgent.desc} <span style={{ color: 'rgba(255,255,255,0.4)' }}>· {urgent.cur}</span>
                </div>
              </div>
              <div style={{ fontSize: 16, color: GOLD, flexShrink: 0 }}>→</div>
            </div>
          )
        })()}

        {/* ── BERÄTTELSE ───────────────────────────────────────────────────── */}
        <div style={{ margin: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.8 }}>BERÄTTELSE</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Season narrative */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: MUTED, letterSpacing: 1.5, marginBottom: 10 }}>
            SÄSONGEN I KORTHET
          </div>
          <div style={{ borderLeft: '2px solid rgba(245,194,0,0.28)', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {narrative.map((sentence, i) => (
              <p key={i} style={{ margin: 0, lineHeight: 1.65,
                fontSize: i === 0 ? 14 : 13,
                fontWeight: i === 0 ? 500 : 400,
                color: i === 0 ? 'rgba(255,255,255,0.85)' : i < 3 ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.48)' }}>
                {sentence}
              </p>
            ))}
          </div>
        </div>

        {/* Hot streak banner — lives in Story section */}
        {sAvg.current >= 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', marginTop: 12,
            background: 'linear-gradient(90deg, rgba(93,202,165,0.1) 0%, rgba(93,202,165,0.02) 100%)',
            border: `1px solid rgba(93,202,165,0.2)`, borderRadius: 14, margin: '12px 20px 0' }}>
            <div className="streak-icon" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(93,202,165,0.12)', border: '1px solid rgba(93,202,165,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={20} color={GREEN} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: GREEN, letterSpacing: -0.2 }}>
                {sAvg.current} spel i rad över snitt
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                Pågående svit — bowla idag för att hålla den vid liv
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: GREEN, lineHeight: 1, flexShrink: 0 }}>
              {sAvg.current}
            </div>
          </div>
        )}

        {/* Exploratory cards carousel — 3 cards (Säsongskurva promoted above) */}
        <div ref={cardRowRef} onScroll={handleCardScroll}
          className="noscroll"
          style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '16px 20px 4px', scrollbarWidth: 'none' } as React.CSSProperties}>
          <WhatIfCard     seasonAvg={seasonAvg} totalSum={totalSum}   totalGames={allGames.length} onExpand={() => setExpanded('whatif')} />
          <ChallengesCard                                                                           onExpand={() => setExpanded('challenges')} />
          <DuellCard      matchAvgs={matchAvgs}                                                     onExpand={() => setExpanded('duell')} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 0 4px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 6, borderRadius: 3, transition: 'all 0.2s ease',
              width: i === activeCard ? 18 : 6,
              background: i === activeCard ? GOLD : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>

        {/* ── HISTORIK ─────────────────────────────────────────────────────── */}
        <div style={{ margin: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.8 }}>HISTORIK</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>


        {/* Record chips — season bests only, no streak (streak has dedicated banner) */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 20px 0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <Trophy size={13} color={GOLD} />
            <span style={{ fontSize: 12, color: MUTED }}>Bästa serie:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{bestSeries}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <Star size={13} color={BLUE} />
            <span style={{ fontSize: 12, color: MUTED }}>200+-svit:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>{s200.best} spel</span>
          </div>
        </div>

        {/* Match log */}
        <div style={{ marginTop: 16, borderTop: `1px solid ${BORDER}` }}>
          {/* Header + filter tabs */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px 8px', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: MUTED, letterSpacing: 2, marginRight: 4 }}>MATCHLOGG</span>
            {(['alla', 'bästa', 'hemma', 'borta'] as const).map(f => (
              <button key={f} onClick={() => setMatchFilter(f)}
                style={{ padding: '8px 12px', minHeight: 36, borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                  background: matchFilter === f ? 'rgba(245,194,0,0.15)' : 'rgba(255,255,255,0.05)',
                  color: matchFilter === f ? GOLD : 'rgba(255,255,255,0.3)',
                  outline: `1px solid ${matchFilter === f ? 'rgba(245,194,0,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
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
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>vs {m.opp}</div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        {m.games.map((g, gi) => (
                          <span key={gi} style={{ fontSize: g >= 250 ? 14 : 12, fontWeight: g >= 200 ? 700 : 400, color: g >= 250 ? BLUE : g >= 200 ? GOLD : MUTED }}>{g}</span>
                        ))}
                        <span style={{ marginLeft: 2 }}><MatchSparkline games={m.games} /></span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2, color: m.result.startsWith('W') ? GREEN : m.result.startsWith('L') ? '#e05555' : MUTED }}>{m.result}</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: avg >= seasonAvg ? GOLD : MUTED }}>{total}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, padding: '0 20px 10px' }}>
                    {[
                      { type: 'flame' as const, Icon: Flame, my: myFlame, count: (rxData?.flame ?? 0) + (myFlame ? 1 : 0), color: '#f5a623' },
                      { type: 'heart' as const, Icon: Heart, my: myHeart, count: (rxData?.heart ?? 0) + (myHeart ? 1 : 0), color: '#e05555' },
                    ].map(({ type, Icon, my, count, color }) => (
                      <button key={type} onClick={e => toggleReaction(i, type, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5,
                          padding: '10px 16px', minHeight: 44, borderRadius: 22, border: 'none', cursor: 'pointer',
                          background: my ? `${color}22` : 'rgba(255,255,255,0.05)',
                          outline: `1px solid ${my ? color + '55' : 'rgba(255,255,255,0.08)'}` }}>
                        <Icon size={14} color={my ? color : 'rgba(255,255,255,0.3)'} fill={my ? color : 'none'} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: my ? color : 'rgba(255,255,255,0.35)' }}>{count}</span>
                      </button>
                    ))}
                  </div>
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
          <div style={{ width: '100%', maxWidth: 560, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(245,194,0,0.14) 0%, rgba(11,21,40,0.97) 100%)',
            border: '1px solid rgba(245,194,0,0.45)',
            boxShadow: '0 8px 40px rgba(245,194,0,0.25), 0 2px 12px rgba(0,0,0,0.5)',
            overflow: 'hidden' }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #f5c200, rgba(245,194,0,0.2))' }} />
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flexShrink: 0, textAlign: 'center',
                minWidth: 64, background: 'rgba(245,194,0,0.1)', borderRadius: 12,
                padding: '8px 10px', border: '1px solid rgba(245,194,0,0.25)' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: GOLD,
                  lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {popupMoment.score}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'white',
                  lineHeight: 1.2, marginBottom: 4 }}>
                  {popupMoment.label}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>{popupMoment.sub}</div>
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
                style={{ flex: 1, padding: '7px 0', borderRadius: 12, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  background: curveMetric === m ? `${MCFG[m].color}18` : 'transparent',
                  border: `1px solid ${curveMetric === m ? MCFG[m].color + '55' : 'rgba(255,255,255,0.1)'}`,
                  color: curveMetric === m ? MCFG[m].color : MUTED }}>
                {MCFG[m].label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{seasonAvg} <span style={{ fontSize: 13, color: MUTED, fontWeight: 400 }}>snitt</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: formDiff > 0 ? GREEN : '#e05555' }}>
              {formDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(formDiff)} p senaste 4 matcher
            </div>
          </div>
          <FullCurve matchAvgs={matchAvgs} seasonAvg={seasonAvg} metric={curveMetric} tapped={curveTapped} onTap={setCurveTapped} />
          {curveMetric === 'snitt' && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', textAlign: 'center', marginTop: 8 }}>Tryck på en punkt för matchinfo</div>
          )}
          {curveTapM && (
            <div style={{ marginTop: 16, padding: '14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>vs {curveTapM.opp}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{curveTapM.date}</div>
                </div>
                <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  color: curveTapM.result.startsWith('W') ? GREEN : curveTapM.result.startsWith('L') ? '#e05555' : MUTED,
                  background: curveTapM.result.startsWith('W') ? 'rgba(93,202,165,0.12)' : curveTapM.result.startsWith('L') ? 'rgba(224,85,85,0.12)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${curveTapM.result.startsWith('W') ? 'rgba(93,202,165,0.3)' : curveTapM.result.startsWith('L') ? 'rgba(224,85,85,0.3)' : BORDER}` }}>
                  {curveTapM.result}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {curveTapM.games.map((g, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: g >= 250 ? BLUE : g >= 200 ? GOLD : MUTED }}>{g}</div>
                    <div style={{ fontSize: 8, color: MUTED, marginTop: 3 }}>S{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Sheet>
      )}

      {expanded === 'whatif' && (
        <Sheet title="VAD HÄNDER OM..." onClose={close}>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>Dra reglaget — se hur nästa match påverkar ditt snitt</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Du snittade</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{whatIfVal}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>i nästa match</div>
            </div>
            <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.12)', fontWeight: 300 }}>→</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Nytt säsongssnitt</div>
              <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, color: projDiff > 0 ? GREEN : projDiff < 0 ? '#e05555' : MUTED }}>{projAvg}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                {projDiff > 0 ? <TrendingUp size={14} color={GREEN} /> : projDiff < 0 ? <TrendingDown size={14} color="#e05555" /> : null}
                <span style={{ fontSize: 14, fontWeight: 700, color: projDiff > 0 ? GREEN : projDiff < 0 ? '#e05555' : MUTED }}>
                  {projDiff > 0 ? `+${projDiff}` : projDiff < 0 ? projDiff : 'oförändrat'}
                </span>
              </div>
            </div>
          </div>
          <input type="range" min="140" max="280" step="5" value={whatIfVal}
            onChange={e => setWhatIfVal(Number(e.target.value))}
            style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginTop: 6 }}>
            <span>140</span><span style={{ color: GOLD, fontWeight: 600 }}>Ditt snitt: {seasonAvg}</span><span>280</span>
          </div>
        </Sheet>
      )}

      {expanded === 'challenges' && (
        <Sheet title="UTMANINGAR" onClose={close}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CHALLENGES.map((c, i) => (
              <div key={i} style={{ background: c.done ? 'rgba(93,202,165,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${c.done ? 'rgba(93,202,165,0.25)' : c.progress >= 85 ? 'rgba(245,194,0,0.3)' : BORDER}`, borderRadius: 16, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: c.done ? 0 : 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: c.done ? 'rgba(93,202,165,0.15)' : c.progress >= 85 ? 'rgba(245,194,0,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${c.done ? 'rgba(93,202,165,0.3)' : c.progress >= 85 ? 'rgba(245,194,0,0.3)' : BORDER}` }}>
                    <CIcon name={c.icon} size={18} color={c.done ? GREEN : c.progress >= 85 ? GOLD : 'rgba(255,255,255,0.5)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.done ? GREEN : 'white' }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{c.desc}</div>
                  </div>
                  {c.done && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: GREEN, padding: '3px 10px', borderRadius: 20, background: 'rgba(93,202,165,0.15)', border: '1px solid rgba(93,202,165,0.3)', flexShrink: 0 }}>
                      <Check size={11} /> Klar
                    </div>
                  )}
                </div>
                {!c.done && (
                  <>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                      <div className={c.progress >= 85 ? 'challenge-urgent' : undefined}
                        style={{ height: '100%', width: `${c.progress}%`,
                          background: c.progress >= 85 ? `linear-gradient(90deg, rgba(245,194,0,0.6), ${GOLD})` : `linear-gradient(90deg, rgba(245,194,0,0.45), ${GOLD})`,
                          borderRadius: 4 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: MUTED }}>{c.cur}</span>
                      <span style={{ fontSize: 11, color: c.progress >= 85 ? GOLD : MUTED, fontWeight: c.progress >= 85 ? 700 : 400 }}>{c.progress}%</span>
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
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Den här säsongen vs förra säsongen</div>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
              <path d={smooth(lastPts)} fill="none" stroke="rgba(160,175,200,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,3" />
              <path d={smooth(thisPts)} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={thisPts[thisPts.length-1].x} cy={thisPts[thisPts.length-1].y} r={5} fill={GOLD} stroke="rgba(245,194,0,0.3)" strokeWidth="5" />
              <circle cx={lastPts[lastPts.length-1].x} cy={lastPts[lastPts.length-1].y} r={3} fill="rgba(160,175,200,0.4)" />
              <text x={W - PAD.r + 4} y={cy(matchAvgs[matchAvgs.length-1]) + 4} fill={GOLD} fontSize="8" fontWeight="bold">i år</text>
              <text x={W - PAD.r + 4} y={cy(LAST_SEASON[LAST_SEASON.length-1]) + 4} fill="rgba(160,175,200,0.55)" fontSize="8">förra</text>
              <text x={PAD.l} y={H - 3} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="middle">{MATCHES[0].date}</text>
              <text x={W - PAD.r} y={H - 3} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="end">{MATCHES[MATCHES.length-1].date}</text>
            </svg>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(245,194,0,0.07)', border: '1px solid rgba(245,194,0,0.18)', borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: GOLD }}>{thisAvg}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 3, letterSpacing: 1 }}>DENNA SÄSONG</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 52, gap: 2 }}>
                <TrendingUp size={16} color={GREEN} />
                <div style={{ fontSize: 16, fontWeight: 900, color: GREEN }}>{thisAvg - lastAvg}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'rgba(160,175,200,0.6)' }}>{lastAvg}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 3, letterSpacing: 1 }}>FÖRRA SÄSONGEN</div>
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
              <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{tapM.date}</div>
            </div>
            <div style={{ padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: tapM.result.startsWith('W') ? 'rgba(93,202,165,0.15)' : tapM.result.startsWith('L') ? 'rgba(224,85,85,0.15)' : 'rgba(255,255,255,0.08)',
              color: tapM.result.startsWith('W') ? GREEN : tapM.result.startsWith('L') ? '#e05555' : MUTED,
              border: `1px solid ${tapM.result.startsWith('W') ? 'rgba(93,202,165,0.3)' : tapM.result.startsWith('L') ? 'rgba(224,85,85,0.3)' : BORDER}` }}>
              {tapM.result}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {tapM.games.map((g, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 4px',
                background: g >= 250 ? 'rgba(122,180,232,0.08)' : g >= 200 ? 'rgba(245,194,0,0.07)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${g >= 250 ? 'rgba(122,180,232,0.25)' : g >= 200 ? 'rgba(245,194,0,0.2)' : BORDER}`,
                borderRadius: 14 }}>
                <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: g >= 250 ? BLUE : g >= 200 ? GOLD : MUTED }}>{g}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>SPEL {i + 1}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ l: 'TOTALT', v: tapM.games.reduce((a, b) => a + b) }, { l: 'MATCHSNITT', v: Math.round(tapM.games.reduce((a, b) => a + b) / tapM.games.length) }].map(s => (
              <div key={s.l} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>{s.v}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 3, letterSpacing: 1 }}>{s.l}</div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, marginBottom: 20, background: `${hl.color}14`, border: `1px solid ${hl.color}40` }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${hl.color}20`, border: `2px solid ${hl.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CIcon name={hl.iconName} size={20} color={hl.color} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: hl.color }}>{hl.label}</div>
                  {hl.sublabel && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{hl.sublabel}</div>}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>vs {m.opp}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{m.date}</div>
              </div>
              <div style={{ padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: m.result.startsWith('W') ? 'rgba(93,202,165,0.15)' : m.result.startsWith('L') ? 'rgba(224,85,85,0.15)' : 'rgba(255,255,255,0.08)',
                color: m.result.startsWith('W') ? GREEN : m.result.startsWith('L') ? '#e05555' : MUTED,
                border: `1px solid ${m.result.startsWith('W') ? 'rgba(93,202,165,0.3)' : m.result.startsWith('L') ? 'rgba(224,85,85,0.3)' : BORDER}` }}>
                {m.result}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {m.games.map((g, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 4px',
                  background: g >= 250 ? 'rgba(122,180,232,0.08)' : g >= 200 ? 'rgba(245,194,0,0.07)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${g >= 250 ? 'rgba(122,180,232,0.25)' : g >= 200 ? 'rgba(245,194,0,0.2)' : BORDER}`,
                  borderRadius: 14 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: g >= 250 ? BLUE : g >= 200 ? GOLD : MUTED }}>{g}</div>
                  <div style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>SPEL {i + 1}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[{ l: 'TOTALT', v: total }, { l: 'MATCHSNITT', v: avg }].map(s => (
                <div key={s.l} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: MUTED, marginTop: 3, letterSpacing: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: MUTED }}>Match {dnaSpoke + 1} av {MATCHES.length} denna säsong</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {avg >= seasonAvg ? <TrendingUp size={12} color={GREEN} /> : <TrendingDown size={12} color="#e05555" />}
                <span style={{ fontSize: 11, fontWeight: 700, color: avg >= seasonAvg ? GREEN : '#e05555' }}>
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
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 22, lineHeight: 1.75 }}>
              Ditt DNA är ett <span style={{ color: 'white', fontWeight: 600 }}>unikt avtryck</span> skapat från dina {MATCHES.length} matcher denna säsong.
              Varje av de {MATCHES.length} spetsarna representerar en match. Ju längre spetsen, desto bättre var din form den dagen.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
              <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} className="dna-body" style={{ display: 'block' }}>
                <defs>
                  <radialGradient id="li_g" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(245,194,0,0.26)" />
                    <stop offset="100%" stopColor="rgba(245,194,0,0.03)" />
                  </radialGradient>
                  <filter id="li_glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {[32, 65, 98, 130].map(r => (
                  <circle key={r} cx={LCX} cy={LCY} r={r} fill="none" stroke="rgba(245,194,0,0.12)" strokeWidth="1" />
                ))}
                {lSpokes.map((p, i) => (
                  <line key={i} x1={LCX} y1={LCY} x2={p.x} y2={p.y} stroke="rgba(245,194,0,0.08)" strokeWidth="1" />
                ))}
                <path d={lPath} fill="url(#li_g)" filter="url(#li_glow)" />
                <path d={lPath} fill="none" stroke="rgba(245,194,0,0.72)" strokeWidth="2" />
                {lSpokes.map((p, i) => {
                  const isBest  = i === bestIdx
                  const isWorst = i === worstIdx
                  const hl2     = DNA_HIGHLIGHTS.find(h => h.idx === i)
                  const color   = hl2 ? hl2.color : isBest ? GOLD : isWorst ? 'rgba(160,175,200,0.5)' : 'rgba(245,194,0,0.65)'
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
                    <text key={li} x={lx} y={ly + 4} fill={li === 0 ? GOLD : 'rgba(255,255,255,0.4)'}
                      fontSize="10" fontWeight="700" textAnchor={anchor}>
                      {li === 0 ? 'Bäst' : 'Lägst'}
                    </text>
                  )
                })}
                <circle cx={LCX} cy={LCY} r={26} fill="#141e2e" stroke="rgba(245,194,0,0.35)" strokeWidth="1.5" />
                <text x={LCX} y={LCY + 5} fill={GOLD} fontSize="13" fontWeight="900" textAnchor="middle">SH</text>
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { l: 'BÄSTA FORM',  v: `${Math.max(...matchAvgs)}`, sub: 'snitt en match', c: GOLD },
                { l: 'LÄGSTA FORM', v: `${Math.min(...matchAvgs)}`, sub: 'snitt en match', c: MUTED },
                { l: 'SPANN',       v: `${Math.max(...matchAvgs) - Math.min(...matchAvgs)}p`, sub: 'variation', c: BLUE },
              ].map(s => (
                <div key={s.l} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 14 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 8, color: MUTED, marginTop: 4, letterSpacing: 1 }}>{s.l}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, borderLeft: `3px solid ${GOLD}` }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>
                Tryck på en spets i profilen för att se matchdetaljerna — poäng, motståndare och hur du presterade jämfört med ditt snitt.
              </div>
            </div>
          </Sheet>
        )
      })()}
    </main>
  )
}
