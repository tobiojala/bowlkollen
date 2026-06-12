'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useColors } from '@/components/ThemeProvider'
import type { HonorEntry } from '@/app/home/types'

function CountUp({ target, active }: { target: number; active: boolean }) {
  const [val, setVal] = useState(target)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!active || hasRun.current) return
    hasRun.current = true
    const from = Math.max(0, target - 40)
    const duration = 750
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(from + (target - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target])

  return <>{val}</>
}

function HonorCard({ entry, isActive }: { entry: HonorEntry; isActive: boolean }) {
  const { C, isDark } = useColors()
  const isPerfect    = entry.score === 300
  const isHighSeries = !isPerfect && (entry.seriesTotal ?? 0) >= 950
  const isElite      = !isPerfect && !isHighSeries && entry.score >= 250
  const displayScore = isHighSeries ? (entry.seriesTotal ?? entry.score) : entry.score
  const [first, ...rest] = entry.playerName.split(' ')
  const last = rest.join(' ')

  const base: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    flex: '0 0 78vw', maxWidth: 320, borderRadius: 22, textDecoration: 'none',
    padding: '36px 24px', minHeight: 210, scrollSnapAlign: 'start',
    WebkitTapHighlightColor: 'transparent',
  }

  if (isPerfect) return (
    <Link href={`/matches/${entry.matchId}`} style={{
      ...base,
      background: 'linear-gradient(160deg,#0c0c0c,#000000)',
      border: '1px solid rgba(255,255,255,0.13)',
      boxShadow: '0 0 60px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.6)',
    }}>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 3.5, marginBottom: 18,
        background: 'linear-gradient(90deg,#7a8ab0,#ffffff 48%,#7a8ab0)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        ◆ PERFECT GAME
      </div>
      <div className="num" style={{ fontSize: 76, lineHeight: 1, color: '#fff',
        textShadow: '0 0 6px #fff, 0 0 24px rgba(255,255,255,0.85), 0 0 70px rgba(255,255,255,0.3)' }}>
        <CountUp target={300} active={isActive} />
      </div>
      {entry.seriesTotal && (
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 10, letterSpacing: 0.5,
          color: 'rgba(155,175,220,0.65)' }}>{entry.seriesTotal} totalt</div>
      )}
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(210,222,245,0.9)' }}>{first}</div>
        {last && <div style={{ fontSize: 12, color: 'rgba(135,155,195,0.65)', marginTop: 2 }}>{last}</div>}
      </div>
    </Link>
  )

  if (isHighSeries) return (
    <Link href={`/matches/${entry.matchId}`} style={{
      ...base,
      background: isDark
        ? 'linear-gradient(160deg,#060810,#020408)'
        : 'linear-gradient(160deg,#e6eaff,#f0f3ff)',
      border: `1px solid ${isDark ? 'rgba(120,150,255,0.14)' : 'rgba(90,120,210,0.22)'}`,
      boxShadow: isDark
        ? '0 0 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(110,145,255,0.04)'
        : '0 4px 32px rgba(90,120,210,0.14)',
    }}>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 3.5, marginBottom: 18,
        background: isDark
          ? 'linear-gradient(90deg,#6070a0,#b8c8f0 50%,#6070a0)'
          : 'linear-gradient(90deg,#3858a0,#5878c0 50%,#3858a0)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        ◇ HÖG SERIE
      </div>
      <div className="num" style={{ fontSize: 66, lineHeight: 1,
        color: isDark ? '#c8d8f4' : '#2e4a90',
        textShadow: isDark ? '0 0 14px rgba(170,200,255,0.65), 0 0 36px rgba(140,175,255,0.2)' : 'none' }}>
        <CountUp target={displayScore} active={isActive} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 9,
        color: isDark ? 'rgba(110,140,200,0.7)' : 'rgba(70,100,175,0.7)' }}>
        {entry.score} bäst i spelet
      </div>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700,
          color: isDark ? 'rgba(195,212,245,0.88)' : '#243570' }}>{first}</div>
        {last && <div style={{ fontSize: 12, marginTop: 2,
          color: isDark ? 'rgba(115,138,190,0.65)' : 'rgba(70,95,165,0.65)' }}>{last}</div>}
      </div>
    </Link>
  )

  const isGold = entry.score >= 220
  const cardBorder = isElite ? 'rgba(245,194,0,0.42)' : isGold ? 'rgba(245,194,0,0.26)' : 'rgba(245,194,0,0.16)'
  const glowAmt    = isElite ? '0.13' : '0.06'
  const scoreColor = isElite ? '#ffffff' : '#f5c200'
  const scoreShadow = isElite
    ? '0 0 14px rgba(255,255,255,0.65), 0 0 36px rgba(255,255,255,0.22)'
    : '0 0 12px rgba(245,194,0,0.6), 0 0 32px rgba(245,194,0,0.22)'
  const label = isElite ? '★ ELITE' : isGold ? '◆ TOP' : '▸ TOPP'

  return (
    <Link href={`/matches/${entry.matchId}`} style={{
      ...base,
      background: isDark
        ? 'linear-gradient(160deg,rgba(28,20,0,1),rgba(10,8,0,1))'
        : 'linear-gradient(160deg,rgba(255,251,232,1),rgba(255,255,248,1))',
      border: `1px solid ${cardBorder}`,
      boxShadow: isDark
        ? `0 0 50px rgba(245,194,0,${glowAmt}), 0 8px 32px rgba(0,0,0,0.6)`
        : '0 4px 24px rgba(245,194,0,0.12)',
    }}>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 3.5, marginBottom: 18,
        background: 'linear-gradient(90deg,#c0a028,#f5c200 50%,#c0a028)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {label}
      </div>
      <div className="num" style={{ fontSize: isElite ? 66 : 58, lineHeight: 1,
        color: scoreColor, textShadow: scoreShadow }}>
        <CountUp target={entry.score} active={isActive} />
      </div>
      {entry.seriesTotal && (
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 9,
          color: 'rgba(198,165,46,0.62)' }}>{entry.seriesTotal} totalt</div>
      )}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700,
          color: isDark ? 'rgba(240,222,148,0.9)' : '#4a3800' }}>{first}</div>
        {last && <div style={{ fontSize: 12, marginTop: 2,
          color: isDark ? 'rgba(185,165,95,0.62)' : 'rgba(110,84,14,0.68)' }}>{last}</div>}
      </div>
    </Link>
  )
}

export default function HonorFeed({ honor }: { honor: HonorEntry[] }) {
  const { C, isDark } = useColors()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !el.firstElementChild) return
    const cardWidth = (el.firstElementChild as HTMLElement).offsetWidth
    setActiveIdx(Math.min(Math.round(el.scrollLeft / (cardWidth + 12)), honor.length - 1))
  }, [honor.length])

  if (!honor.length) return null

  return (
    <section style={{ paddingTop: 32 }}>
      <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#c0a028' }}>HONOR ROLL</span>
        <span style={{ fontSize: 9, color: C.muted, opacity: 0.6 }}>· senaste 7 dagarna</span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex', gap: 12,
          overflowX: 'auto', scrollbarWidth: 'none',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          padding: '0 20px 20px',
        } as React.CSSProperties}
      >
        {honor.map((e, i) => (
          <HonorCard key={i} entry={e} isActive={i === activeIdx} />
        ))}
      </div>

      {honor.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingBottom: 4 }}>
          {honor.map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2,
              transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              width: i === activeIdx ? 18 : 4,
              background: i === activeIdx ? '#c0a028' : (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.11)'),
            }} />
          ))}
        </div>
      )}
    </section>
  )
}
