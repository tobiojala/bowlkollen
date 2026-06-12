'use client'

import { useState } from 'react'
import { DNA_HIGHLIGHTS } from '@/app/mockup/data'

const SW = 360, SH = 300
const CX = 180, CY = 160
const AVATAR_R = 36
const SPOKE_START = AVATAR_R + 6   // spoke lines start just outside avatar
const rMin = 52, rMax = 122
const LINE = 28                    // callout line length

export default function ProfileDNA({ matchAvgs, overlayAvgs, onTapSpoke, onDNATap, isLive }: {
  matchAvgs: number[]
  overlayAvgs?: number[]
  onTapSpoke: (i: number) => void
  onDNATap: () => void
  isLive?: boolean
}) {
  const [hov, setHov] = useState(false)
  const n   = matchAvgs.length
  const mn  = Math.min(...matchAvgs), mx = Math.max(...matchAvgs)
  const amp = hov ? 7 : 3.5

  const spokes = matchAvgs.map((avg, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2
    const r = rMin + ((avg - mn) / (mx === mn ? 1 : mx - mn)) * (rMax - rMin)
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle), r, angle }
  })
  const pathD = spokes.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  return (
    <svg width="100%" viewBox={`0 0 ${SW} ${SH}`}
      style={{ display: 'block', overflow: 'visible' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <defs>
        <radialGradient id="dna_g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={hov ? 'rgba(245,194,0,0.22)' : 'rgba(245,194,0,0.14)'} />
          <stop offset="100%" stopColor="rgba(245,194,0,0.02)" />
        </radialGradient>
        <filter id="dna_glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation={hov ? '8' : '5'} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="hl_glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="avatar_glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Tap background → open DNA info */}
      <rect x={0} y={0} width={SW} height={SH} fill="transparent"
        onClick={onDNATap} style={{ cursor: 'pointer' }} />

      {/* Previous season ghost overlay — renders behind current season */}
      {overlayAvgs && (() => {
        const mn2 = Math.min(...overlayAvgs), mx2 = Math.max(...overlayAvgs)
        const pts = overlayAvgs.map((avg, i) => {
          const angle = (2 * Math.PI * i / overlayAvgs.length) - Math.PI / 2
          const r = rMin + ((avg - mn2) / (mx2 === mn2 ? 1 : mx2 - mn2)) * (rMax - rMin)
          return `${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`
        })
        const d = `M ${pts.join(' L ')} Z`
        return (
          <path d={d} fill="rgba(122,180,232,0.07)"
            stroke="rgba(122,180,232,0.5)" strokeWidth="1.5" strokeDasharray="5,3" />
        )
      })()}

      {/* Ring guides + polygon — breathe together */}
      <g className={isLive ? 'dna-body-live' : hov ? 'dna-body-hov' : 'dna-body'}>
        {[rMin, rMin + (rMax - rMin) * 0.5, rMax].map(r => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none"
            stroke={hov ? 'rgba(244,245,247,0.10)' : 'rgba(244,245,247,0.06)'} strokeWidth="1" />
        ))}
        {/* Spoke lines start outside avatar to keep center clean */}
        {spokes.map((p, i) => (
          <line key={i}
            x1={(CX + SPOKE_START * Math.cos(p.angle)).toFixed(1)}
            y1={(CY + SPOKE_START * Math.sin(p.angle)).toFixed(1)}
            x2={p.x} y2={p.y}
            stroke={hov ? 'rgba(244,245,247,0.07)' : 'rgba(244,245,247,0.05)'} strokeWidth="1" />
        ))}
        <path d={pathD} fill="url(#dna_g)" filter="url(#dna_glow)" />
        <path d={pathD} fill="none"
          stroke={hov ? 'rgba(245,194,0,0.85)' : 'rgba(245,194,0,0.65)'}
          strokeWidth={hov ? '2.5' : '2'} />
      </g>

      {/* Floating spoke dots */}
      {spokes.map((p, i) => {
        const hl    = DNA_HIGHLIGHTS.find(h => h.idx === i)
        const cos   = Math.cos(p.angle), sin = Math.sin(p.angle)
        const dx    = (cos * amp).toFixed(2), dy = (sin * amp).toFixed(2)
        const dur   = `${2.0 + (i % 5) * 0.22}s`
        const begin = `-${((i / n) * 2.4).toFixed(2)}s`
        return (
          <g key={i} onClick={(e) => { e.stopPropagation(); onTapSpoke(i) }} style={{ cursor: 'pointer' }}>
            <animateTransform attributeName="transform" type="translate"
              values={`0,0; ${dx},${dy}; 0,0`}
              dur={dur} begin={begin} repeatCount="indefinite" calcMode="spline"
              keySplines="0.5 0 0.5 1; 0.5 0 0.5 1" />
            <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
            {hl ? (
              <g filter="url(#hl_glow)">
                <circle cx={p.x} cy={p.y} r={24} fill={hl.color} opacity="0.07" className="dna-hl-pulse" />
                <circle cx={p.x} cy={p.y} r={15} fill={hl.color} opacity="0.15" className="dna-hl-pulse" />
                <circle cx={p.x} cy={p.y} r={9.5} fill={hl.color} opacity="0.35" />
                <circle cx={p.x} cy={p.y} r={6.5} fill={hl.color} opacity="0.96" />
              </g>
            ) : (
              <circle cx={p.x} cy={p.y} r={hov ? 4 : 3.5} fill="rgba(245,194,0,0.68)" />
            )}
          </g>
        )
      })}

      {/* Callout labels */}
      {DNA_HIGHLIGHTS.map(h => {
        const p = spokes[h.idx]
        if (!p) return null
        const ex = p.x + LINE * Math.cos(p.angle)
        const ey = p.y + LINE * Math.sin(p.angle)
        const anchor: 'start' | 'end' | 'middle' =
          Math.cos(p.angle) > 0.25 ? 'start' : Math.cos(p.angle) < -0.25 ? 'end' : 'middle'
        const tx = ex + (anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0)
        return (
          <g key={`lbl_${h.idx}`} style={{ pointerEvents: 'none' }}>
            <line x1={p.x} y1={p.y} x2={ex} y2={ey}
              stroke={h.color} strokeWidth="1" opacity="0.55" strokeDasharray="2,1.5" />
            <circle cx={ex} cy={ey} r={1.5} fill={h.color} opacity="0.7" />
            <text x={tx} y={ey - 3} fill={h.color} fontSize="9" fontWeight="800"
              textAnchor={anchor} opacity="0.95">{h.label}</text>
            {h.sublabel && (
              <text x={tx} y={ey + 8} fill={h.color} fontSize="7" fontWeight="600"
                textAnchor={anchor} opacity="0.65">{h.sublabel}</text>
            )}
          </g>
        )
      })}

      {/* Avatar — center of DNA, rendered last so it sits on top */}
      <g filter="url(#avatar_glow)" style={{ pointerEvents: 'none' }}>
        <circle cx={CX} cy={CY} r={AVATAR_R + 5} fill="rgba(245,194,0,0.08)" />
      </g>
      <circle cx={CX} cy={CY} r={AVATAR_R} fill="#0b0d10"
        stroke="rgba(245,194,0,0.85)" strokeWidth="2" />
      <text x={CX} y={CY + 8} fill="#f5c200" fontSize="22" fontWeight="900"
        textAnchor="middle" style={{ letterSpacing: '-0.5px' }}>SH</text>
    </svg>
  )
}
