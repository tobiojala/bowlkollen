'use client'

import { useState } from 'react'

const SW = 360, SH = 296, CX = 180, CY = 152
const AVATAR_R = 36, SPOKE_START = AVATAR_R + 6
const rMin = 52, rMax = 122, LINE = 26

export default function PlayerDNA({ matchAvgs, overlayAvgs, initials, onDNATap }: {
  matchAvgs: number[]
  overlayAvgs?: number[]
  initials: string
  onDNATap: () => void
}) {
  const [hov, setHov] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const hasOverlay = !!overlayAvgs

  const n = matchAvgs.length
  if (n === 0) return null
  const mn = Math.min(...matchAvgs), mx = Math.max(...matchAvgs)

  const spokes = matchAvgs.map((avg, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2
    const r = rMin + ((avg - mn) / (mx === mn ? 1 : mx - mn)) * (rMax - rMin)
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle), r, angle }
  })
  const pathD = spokes.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  // Previous season ghost polygon
  const overlayPath = overlayAvgs && overlayAvgs.length > 0 ? (() => {
    const om = Math.min(...overlayAvgs), ox = Math.max(...overlayAvgs)
    const pts = overlayAvgs.map((avg, i) => {
      const angle = (2 * Math.PI * i / overlayAvgs.length) - Math.PI / 2
      const r = rMin + ((avg - om) / (ox === om ? 1 : ox - om)) * (rMax - rMin)
      return `${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`
    })
    return `M ${pts.join(' L ')} Z`
  })() : null

  // Peak spoke — the player's best match
  const peakIdx  = matchAvgs.indexOf(mx)
  const peakSpoke = spokes[peakIdx]

  return (
    <div>
      {/* Header row — label + season selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingTop: 14, paddingBottom: 2, position: 'relative' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)', letterSpacing: 2.4 }}>
          DITT DNA
        </span>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: hasOverlay ? 'rgba(122,180,232,0.12)' : 'rgba(255,255,255,0.07)',
              outline: `1px solid ${hasOverlay ? 'rgba(122,180,232,0.25)' : 'rgba(255,255,255,0.1)'}` }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
              color: hasOverlay ? '#7ab4e8' : 'rgba(255,255,255,0.45)' }}>
              {hasOverlay ? '2024/25' : '2025/26'}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)',
              display: 'inline-block', transition: 'transform 0.15s',
              transform: showMenu ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>

          {showMenu && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
              transform: 'translateX(-50%)', zIndex: 50,
              background: '#172030', borderRadius: 14, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.55)', minWidth: 180 }}>
              {[
                { value: '2025', label: '2025/26', sub: 'Aktuell säsong', color: '#f5c200' },
                { value: '2024', label: '2024/25', sub: 'Overlay på DNA', color: '#7ab4e8' },
              ].map((opt, i) => {
                const active = hasOverlay ? opt.value === '2024' : opt.value === '2025'
                return (
                  <button key={opt.value}
                    onClick={e => { e.stopPropagation(); setShowMenu(false) }}
                    style={{ width: '100%', padding: '11px 16px', border: 'none', cursor: 'pointer',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      textAlign: 'left' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? opt.color : 'rgba(255,255,255,0.65)' }}>{opt.label}</div>
                      <div style={{ fontSize: 10, color: '#6b7a99', marginTop: 2 }}>{opt.sub}</div>
                    </div>
                    {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: opt.color, boxShadow: `0 0 6px ${opt.color}` }} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* DNA SVG */}
      <svg width="100%" viewBox={`0 0 ${SW} ${SH}`}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <defs>
          <radialGradient id="dna_pg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={hov ? 'rgba(245,194,0,0.28)' : 'rgba(245,194,0,0.20)'} />
            <stop offset="100%" stopColor="rgba(245,194,0,0.02)" />
          </radialGradient>
          <filter id="dna_pglow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation={hov ? '8' : '5'} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="avatar_pglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect x={0} y={0} width={SW} height={SH} fill="transparent"
          onClick={onDNATap} style={{ cursor: 'pointer' }} />

        {/* Previous season overlay */}
        {overlayPath && (
          <path d={overlayPath} fill="rgba(122,180,232,0.07)"
            stroke="rgba(122,180,232,0.5)" strokeWidth="1.5" strokeDasharray="5,3" />
        )}

        {/* Ring guides + polygon */}
        <g style={{ animation: hov ? 'dna-breathe-fast 2.1s ease-in-out infinite' : 'dna-breathe 3.6s ease-in-out infinite',
          transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
          {[rMin, rMin + (rMax - rMin) * 0.5, rMax].map(r => (
            <circle key={r} cx={CX} cy={CY} r={r} fill="none"
              stroke={hov ? 'rgba(245,194,0,0.18)' : 'rgba(245,194,0,0.10)'} strokeWidth="1" />
          ))}
          {spokes.map((p, i) => (
            <line key={i}
              x1={(CX + SPOKE_START * Math.cos(p.angle)).toFixed(1)}
              y1={(CY + SPOKE_START * Math.sin(p.angle)).toFixed(1)}
              x2={p.x} y2={p.y}
              stroke={hov ? 'rgba(245,194,0,0.10)' : 'rgba(245,194,0,0.07)'} strokeWidth="1" />
          ))}
          <path d={pathD} fill="url(#dna_pg)" filter="url(#dna_pglow)" />
          <path d={pathD} fill="none"
            stroke={hov ? 'rgba(245,194,0,0.85)' : 'rgba(245,194,0,0.65)'}
            strokeWidth={hov ? '2.5' : '2'} />
        </g>

        {/* Floating dots */}
        {spokes.map((p, i) => {
          const isPeak = i === peakIdx
          const dx = (Math.cos(p.angle) * (hov ? 7 : 3.5)).toFixed(2)
          const dy = (Math.sin(p.angle) * (hov ? 7 : 3.5)).toFixed(2)
          const dur = `${2.0 + (i % 5) * 0.22}s`
          const begin = `-${((i / n) * 2.4).toFixed(2)}s`
          return (
            <g key={i} style={{ cursor: 'pointer' }}>
              <animateTransform attributeName="transform" type="translate"
                values={`0,0; ${dx},${dy}; 0,0`}
                dur={dur} begin={begin} repeatCount="indefinite" calcMode="spline"
                keySplines="0.5 0 0.5 1; 0.5 0 0.5 1" />
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
              {isPeak ? (
                <g>
                  <circle cx={p.x} cy={p.y} r={20} fill="rgba(245,194,0,0.08)" />
                  <circle cx={p.x} cy={p.y} r={8} fill="rgba(245,194,0,0.35)" />
                  <circle cx={p.x} cy={p.y} r={5.5} fill="rgba(245,194,0,0.96)" />
                </g>
              ) : (
                <circle cx={p.x} cy={p.y} r={hov ? 4 : 3.5} fill="rgba(245,194,0,0.68)" />
              )}
            </g>
          )
        })}

        {/* Peak callout — best match this season */}
        {peakSpoke && (() => {
          const ex = peakSpoke.x + LINE * Math.cos(peakSpoke.angle)
          const ey = peakSpoke.y + LINE * Math.sin(peakSpoke.angle)
          const anchor: 'start' | 'end' | 'middle' =
            Math.cos(peakSpoke.angle) > 0.25 ? 'start' : Math.cos(peakSpoke.angle) < -0.25 ? 'end' : 'middle'
          const tx = ex + (anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0)
          return (
            <g style={{ pointerEvents: 'none' }}>
              <line x1={peakSpoke.x} y1={peakSpoke.y} x2={ex} y2={ey}
                stroke="rgba(245,194,0,0.55)" strokeWidth="1" strokeDasharray="2,1.5" />
              <circle cx={ex} cy={ey} r={1.5} fill="#f5c200" opacity="0.7" />
              <text x={tx} y={ey - 3} fill="#f5c200" fontSize="9" fontWeight="800"
                textAnchor={anchor} opacity="0.95">Bäst</text>
              <text x={tx} y={ey + 8} fill="#f5c200" fontSize="7" fontWeight="600"
                textAnchor={anchor} opacity="0.65">{mx} snitt</text>
            </g>
          )
        })()}

        {/* Avatar */}
        <g filter="url(#avatar_pglow)" style={{ pointerEvents: 'none' }}>
          <circle cx={CX} cy={CY} r={AVATAR_R + 5} fill="rgba(245,194,0,0.08)" />
        </g>
        <circle cx={CX} cy={CY} r={AVATAR_R} fill="#10161e" stroke="#f5c200" strokeWidth="2.5" />
        <text x={CX} y={CY + 8} fill="#f5c200" fontSize="20" fontWeight="900"
          textAnchor="middle">{initials}</text>
      </svg>
    </div>
  )
}
