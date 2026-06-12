'use client'

import { MATCHES, RANKING_PTS, BK_PROGRESS } from '@/app/mockup/data'
import { norm, smooth } from '@/app/mockup/helpers'

export type Metric = 'snitt' | 'ranking' | 'bk' | 'alla'
export const MCFG: Record<Metric, { label: string; color: string }> = {
  snitt:   { label: 'Snitt',  color: '#f5c200' },
  ranking: { label: 'Rank.',  color: '#7ab4e8' },
  bk:      { label: 'BK',     color: '#5dcaa5' },
  alla:    { label: 'Alla 3', color: 'white'   },
}

const CW = 172

/* Full-width season curve for the profile hero — no axes, no labels,
   just the shape of the season under the hero number. */
export function HeroCurve({ matchAvgs, seasonAvg }: { matchAvgs: number[]; seasonAvg: number }) {
  const W = 360, H = 84
  const PAD = { l: 2, r: 8, t: 10, b: 8 }
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b
  const mn = Math.min(...matchAvgs) - 6, mx = Math.max(...matchAvgs) + 6
  const cx = (i: number) => PAD.l + (i / (matchAvgs.length - 1)) * iW
  const cy = (v: number) => PAD.t + iH - ((v - mn) / (mx - mn)) * iH
  const pts  = matchAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const line = smooth(pts)
  const fill = line + ` L ${pts[pts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L ${PAD.l},${(PAD.t+iH).toFixed(1)} Z`
  const last = pts[pts.length - 1]
  const avgY = cy(seasonAvg)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="hc_f" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(245,194,0,0.18)" /><stop offset="100%" stopColor="rgba(245,194,0,0)" />
        </linearGradient>
        <linearGradient id="hc_l" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(245,194,0,0.35)" /><stop offset="100%" stopColor="#f5c200" />
        </linearGradient>
      </defs>
      <line x1={PAD.l} y1={avgY} x2={W - PAD.r} y2={avgY} stroke="rgba(244,245,247,0.14)" strokeWidth="1" strokeDasharray="3,3" />
      <path d={fill} fill="url(#hc_f)" />
      <path d={line} fill="none" stroke="url(#hc_l)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={4.5} fill="#f5c200" stroke="rgba(245,194,0,0.25)" strokeWidth={5} />
    </svg>
  )
}

export function MiniCurve({ matchAvgs, seasonAvg }: { matchAvgs: number[]; seasonAvg: number }) {
  const W = CW - 28, H = 70
  const PAD = { l: 2, r: 2, t: 4, b: 4 }
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b
  const cx = (i: number) => PAD.l + (i / (matchAvgs.length - 1)) * iW
  const cy = (v: number) => PAD.t + iH - ((v - 150) / 140) * iH
  const pts  = matchAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const line = smooth(pts)
  const fill = line + ` L ${pts[pts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L ${PAD.l},${(PAD.t+iH).toFixed(1)} Z`
  const avgY = cy(seasonAvg)
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="mc_f" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(245,194,0,0.16)" /><stop offset="100%" stopColor="rgba(245,194,0,0)" />
        </linearGradient>
      </defs>
      <line x1={PAD.l} y1={avgY} x2={W - PAD.r} y2={avgY} stroke="rgba(245,194,0,0.28)" strokeWidth="1" strokeDasharray="3,2" />
      <path d={fill} fill="url(#mc_f)" />
      <path d={line} fill="none" stroke="#f5c200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r={4} fill="#f5c200" stroke="rgba(245,194,0,0.3)" strokeWidth={4} />
    </svg>
  )
}

export function FullCurve({ matchAvgs, seasonAvg, metric, tapped, onTap }: {
  matchAvgs: number[]; seasonAvg: number; metric: Metric
  tapped: number | null; onTap: (i: number | null) => void
}) {
  const W = 320, H = 124, PAD = { l: 30, r: 42, t: 14, b: 22 }
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b
  const cx = (i: number) => PAD.l + (i / (matchAvgs.length - 1)) * iW

  if (metric === 'alla') {
    const series = [
      { d: norm(matchAvgs),   c: '#f5c200' },
      { d: norm(RANKING_PTS), c: '#7ab4e8' },
      { d: norm(BK_PROGRESS), c: '#5dcaa5' },
    ]
    const cy = (v: number) => PAD.t + iH - (v / 100) * iH
    return (
      <div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
          {[0, 50, 100].map(v => (
            <g key={v}>
              <line x1={PAD.l} y1={cy(v)} x2={W - PAD.r} y2={cy(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={PAD.l - 4} y={cy(v) + 4} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="end">{v}%</text>
            </g>
          ))}
          {series.map(({ d, c }) => {
            const pts = d.map((v, i) => ({ x: cx(i), y: cy(v) }))
            return <path key={c} d={smooth(pts)} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          })}
          <text x={PAD.l} y={H - 4} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="middle">{MATCHES[0].date}</text>
          <text x={W - PAD.r} y={H - 4} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="end">{MATCHES[MATCHES.length-1].date}</text>
          <text x={PAD.l} y={PAD.t - 3} fill="rgba(255,255,255,0.18)" fontSize="7.5">Normaliserat — visar trendutveckling</text>
        </svg>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {series.map((s, i) => (
            <div key={s.c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 3, borderRadius: 2, background: s.c }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{['Snitt', 'Rank.', 'BK'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const data   = metric === 'snitt' ? matchAvgs : metric === 'ranking' ? RANKING_PTS : BK_PROGRESS
  const color  = MCFG[metric].color
  const [mnV, mxV] = metric === 'snitt' ? [150, 290] : metric === 'ranking' ? [-0.5, 10.5] : [65, 95]
  const gridVs = metric === 'snitt' ? [170, 200, 230, 260] : metric === 'ranking' ? [2, 4, 6, 8] : [70, 75, 80, 85, 90]
  const cy     = (v: number) => PAD.t + iH - ((v - mnV) / (mxV - mnV)) * iH
  const pts    = data.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const line   = smooth(pts)
  const fill   = line + ` L ${pts[pts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L ${PAD.l},${(PAD.t+iH).toFixed(1)} Z`
  const last   = pts[pts.length - 1]
  const gid    = `fc_${metric}`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${gid}_l`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={`${color}40`} /><stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id={`${gid}_f`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={`${color}1a`} /><stop offset="100%" stopColor={`${color}00`} />
        </linearGradient>
      </defs>
      {gridVs.map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={cy(v)} x2={W - PAD.r} y2={cy(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={PAD.l - 4} y={cy(v) + 4} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="end">{v}</text>
        </g>
      ))}
      {metric === 'snitt' && (
        <>
          <line x1={PAD.l} y1={cy(seasonAvg)} x2={W - PAD.r} y2={cy(seasonAvg)} stroke="rgba(245,194,0,0.35)" strokeWidth="1" strokeDasharray="4,3" />
          <text x={W - PAD.r + 4} y={cy(seasonAvg) + 4} fill="rgba(245,194,0,0.6)" fontSize="8.5" fontWeight="bold">snitt {seasonAvg}</text>
        </>
      )}
      <path d={fill} fill={`url(#${gid}_f)`} />
      <path d={line} fill="none" stroke={`url(#${gid}_l)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i} onClick={() => onTap(tapped === i ? null : i)} style={{ cursor: 'pointer' }}>
          <circle cx={p.x} cy={p.y} r={13} fill="transparent" />
          <circle cx={p.x} cy={p.y} r={tapped === i ? 6 : i === pts.length - 1 ? 5 : 2.5}
            fill={tapped === i ? 'white' : color}
            stroke={tapped === i ? color : i === pts.length - 1 ? `${color}44` : 'none'}
            strokeWidth={tapped === i ? 2 : i === pts.length - 1 ? 5 : 0} />
        </g>
      ))}
      <text x={last.x} y={last.y - 11} fill={color} fontSize="9" textAnchor="middle" fontWeight="bold">nu</text>
      <text x={PAD.l} y={H - 4} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="middle">{MATCHES[0].date}</text>
      <text x={W - PAD.r} y={H - 4} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="end">{MATCHES[MATCHES.length-1].date}</text>
    </svg>
  )
}
