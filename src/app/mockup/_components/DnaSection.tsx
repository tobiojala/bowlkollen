'use client'

import { useState } from 'react'
import ProfileDNA from '@/components/mockup/ProfileDNA'
import { LAST_SEASON, COLORS } from '../data'

const { GOLD, BLUE, MUTED } = COLORS

interface DnaSectionProps {
  matchAvgs: number[]
  isLive: boolean
  onTapSpoke: (i: number) => void
  onDnaTap: () => void
}

export default function DnaSection({ matchAvgs, isLive, onTapSpoke, onDnaTap }: DnaSectionProps) {
  const [showOverlay, setShowOverlay]       = useState(false)
  const [showSeasonMenu, setShowSeasonMenu] = useState(false)

  return (
    <>
      {/* Aurora glow behind DNA */}
      <div className="aurora" style={{
        pointerEvents: 'none', position: 'relative', zIndex: 0,
        height: 0, overflow: 'visible',
      }}>
        <div style={{
          position: 'absolute', left: '50%', top: 60,
          width: 340, height: 220,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,194,0,0.09) 0%, rgba(122,180,232,0.04) 55%, transparent 80%)',
          filter: 'blur(28px)',
        }} />
      </div>

      {/* DNA header — label + season selector on the same line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingTop: 14, paddingBottom: 2, position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)', letterSpacing: 1.5 }}>
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
        onTapSpoke={onTapSpoke}
        onDNATap={onDnaTap}
        isLive={isLive}
      />
    </>
  )
}
