'use client'

import { useState } from 'react'
import ProfileDNA from '@/components/mockup/ProfileDNA'
import { COLORS } from '../data'
import type { ProfileHighlight } from '@/lib/profile'

const { GOLD, BLUE, MUTED } = COLORS

interface DnaSectionProps {
  matchAvgs: number[]
  /** Previous-season per-match averages, drawn as a ghost overlay. */
  overlayAvgs?: number[]
  /** Highlight markers placed on their matching spokes. */
  highlights?: readonly ProfileHighlight[]
  /** Center-glyph initials. */
  initials?: string
  isLive: boolean
  onTapSpoke: (i: number) => void
  onDnaTap: () => void
}

export default function DnaSection({ matchAvgs, overlayAvgs, highlights = [], initials = '', isLive, onTapSpoke, onDnaTap }: DnaSectionProps) {
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

      {/* DNA header — label + season selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, padding: '28px 20px 0', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(244,245,247,0.40)',
          letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Bowling-DNA
        </span>

        {/* Season dropdown trigger */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowSeasonMenu(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, minHeight: 32,
              padding: '0 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: '#1c2127' }}>
            <span style={{ fontSize: 12, fontWeight: 600,
              color: showOverlay ? BLUE : 'rgba(244,245,247,0.64)' }}>
              {showOverlay ? '2024/25' : '2025/26'}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(244,245,247,0.24)',
              display: 'inline-block', transition: 'transform 0.15s',
              transform: showSeasonMenu ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>

          {/* Curtain panel */}
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
                      borderTop: i > 0 ? '1px solid rgba(244,245,247,0.07)' : 'none',
                      background: active ? 'rgba(244,245,247,0.05)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700,
                        color: active ? opt.color : 'rgba(244,245,247,0.64)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{opt.sub}</div>
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
      </div>

      {/* DNA hero */}
      <div style={{ width: '84%', margin: '4px auto 0' }}>
        <ProfileDNA
          matchAvgs={matchAvgs}
          overlayAvgs={showOverlay ? overlayAvgs : undefined}
          highlights={highlights}
          initials={initials}
          onTapSpoke={onTapSpoke}
          onDNATap={onDnaTap}
          isLive={isLive}
        />
      </div>
    </>
  )
}
