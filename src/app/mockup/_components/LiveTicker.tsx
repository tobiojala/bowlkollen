'use client'

import { Zap } from 'lucide-react'
import { COLORS } from '../data'

const { GOLD } = COLORS

interface LiveMatch {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  game: number
  totalGames: number
  saraGames: number[]
  saraCurrentScore: number
}

interface LiveTickerProps {
  isLive: boolean
  liveMatch: LiveMatch
  onToggleLive: () => void
  onTriggerMoment: () => void
}

export default function LiveTicker({ isLive, liveMatch, onToggleLive, onTriggerMoment }: LiveTickerProps) {
  const seg = (kp: string) => (
    <span key={kp} style={{ display: 'inline-flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums' }}>
      <span style={{ color: 'rgba(255,255,255,0.18)', padding: '0 10px' }}>·</span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{liveMatch.homeTeam}</span>
      <span style={{ color: 'white', fontWeight: 900, fontSize: 14, margin: '0 7px', lineHeight: 1 }}>{liveMatch.homeScore}</span>
      <span style={{ color: 'rgba(255,255,255,0.22)', fontWeight: 300, fontSize: 11 }}>–</span>
      <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 700, fontSize: 14, margin: '0 7px', lineHeight: 1 }}>{liveMatch.awayScore}</span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{liveMatch.awayTeam}</span>
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
    <div style={{ height: 38, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden',
      background: 'rgba(11,18,30,0.82)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: `1px solid ${isLive ? 'rgba(245,194,0,0.28)' : 'rgba(245,194,0,0.15)'}`,
      boxShadow: 'inset 0 -1px 0 rgba(245,194,0,0.08)' }}>
      {isLive ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 14, flexShrink: 0, zIndex: 1 }}>
            <div className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, boxShadow: `0 0 5px ${GOLD}` }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: 1.2 }}>LIVE</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <div className="ticker-track" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {seg('a')}{seg('b')}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, marginLeft: 14 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>DESIGNMOCKUP</span>
          <span style={{ fontSize: 11, color: 'rgba(245,194,0,0.48)' }}>Spelarprofil</span>
        </>
      )}
      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', paddingRight: 12, flexShrink: 0 }}>
        {isLive && (
          <button onClick={onTriggerMoment}
            style={{ display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>
            <Zap size={11} /> Moment
          </button>
        )}
        <button onClick={onToggleLive}
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
  )
}
