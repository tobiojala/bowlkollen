'use client'

import { MATCHES, RANKING_PTS, BK_PROGRESS } from '@/app/mockup/data'
import { norm, smooth } from '@/app/mockup/helpers'

export type Metric = 'snitt' | 'ranking' | 'bk' | 'alla'
export const MCFG: Record<Metric, { label: string; color: string }> = {
  snitt:   { label: 'Snitt',  color: '#f5c200' },
  ranking: { label: 'Rank.',  color: '#9ca5b3' },
  bk:      { label: 'BK',     color: '#5dcaa5' },
  alla:    { label: 'Alla 3', color: 'white'   },
}

/* Hex color + alpha (0-1) → rgba() string */
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/* Full-width season curve for the profile hero — no axes, no labels,
   just the shape of the season under the hero number. Optional dashed
   projection extends the curve if current form holds. */
export function HeroCurve({ data, seasonAvg, projAvg, color = '#f5c200', gid = 'hc' }: {
  data: number[]
  /** Reference line value (dashed). Omit to hide. */
  seasonAvg?: number
  projAvg?: number
  /** Curve color — gold for snitt, green for BK, blue for ranking */
  color?: string
  /** Unique gradient id — required when several HeroCurves render at once */
  gid?: string
}) {
  const W = 360, H = 84
  const PAD = { l: 2, r: 8, t: 10, b: 8 }
  const iH = H - PAD.t - PAD.b
  // Reserve right-side width for the projection when shown
  const splitX = projAvg !== undefined ? W * 0.8 : W
  const allVals = projAvg !== undefined ? [...data, projAvg] : data
  const vPad = Math.max((Math.max(...allVals) - Math.min(...allVals)) * 0.18, 2)
  const mn = Math.min(...allVals) - vPad, mx = Math.max(...allVals) + vPad
  const cx = (i: number) => PAD.l + (i / (data.length - 1)) * (splitX - PAD.l - PAD.r)
  const cy = (v: number) => PAD.t + iH - ((v - mn) / (mx - mn)) * iH
  const pts  = data.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const line = smooth(pts)
  const fill = line + ` L ${pts[pts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L ${PAD.l},${(PAD.t+iH).toFixed(1)} Z`
  const last = pts[pts.length - 1]
  const projX = W - PAD.r
  const projY = projAvg !== undefined ? cy(projAvg) : 0
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${gid}_f`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={rgba(color, 0.18)} /><stop offset="100%" stopColor={rgba(color, 0)} />
        </linearGradient>
        <linearGradient id={`${gid}_l`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={rgba(color, 0.35)} /><stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {seasonAvg !== undefined && (
        <line x1={PAD.l} y1={cy(seasonAvg)} x2={W - PAD.r} y2={cy(seasonAvg)} stroke="rgba(244,245,247,0.14)" strokeWidth="1" strokeDasharray="3,3" />
      )}
      <path d={fill} fill={`url(#${gid}_f)`} />
      <path d={line} fill="none" stroke={`url(#${gid}_l)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {projAvg !== undefined && (
        <>
          <path d={`M ${last.x.toFixed(1)},${last.y.toFixed(1)} L ${projX.toFixed(1)},${projY.toFixed(1)}`}
            fill="none" stroke={rgba(color, 0.45)} strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round" />
          <circle cx={projX} cy={projY} r={3} fill={rgba(color, 0.45)} />
        </>
      )}
      <circle cx={last.x} cy={last.y} r={4.5} fill={color} stroke={rgba(color, 0.25)} strokeWidth={5} />
    </svg>
  )
}

export function MiniCurve({
  matchAvgs, seasonAvg, height = 70, projAvg,
}: {
  matchAvgs: number[]
  seasonAvg: number
  height?: number
  /** If provided, draws a dashed projection for 3 future matches at this average */
  projAvg?: number
}) {
  const W = 300, H = height
  const N = matchAvgs.length
  // Reserve ~22% of width for projection when shown
  const splitX = projAvg !== undefined ? W * 0.78 : W
  const PAD = { l: 2, r: 2, t: 6, b: 4 }
  const iH = H - PAD.t - PAD.b

  // Adaptive y-scale — fills the full chart height instead of a fixed 150-290 range
  const allVals = projAvg !== undefined ? [...matchAvgs, projAvg] : matchAvgs
  const dataMin = Math.min(...allVals)
  const dataMax = Math.max(...allVals)
  const vPad = Math.max((dataMax - dataMin) * 0.2, 8)
  const mn = dataMin - vPad
  const mx = dataMax + vPad

  const cx = (i: number) => PAD.l + (i / (N - 1)) * (splitX - PAD.l - PAD.r)
  const cy = (v: number) => PAD.t + iH - ((v - mn) / (mx - mn)) * iH

  const pts  = matchAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const line = smooth(pts)
  const fill = line + ` L ${pts[N-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L ${PAD.l},${(PAD.t+iH).toFixed(1)} Z`
  const avgY = cy(seasonAvg)

  // Projection: straight dashed line from last actual point to 3 future points
  const projStartX = pts[N - 1].x
  const projEndX   = W - PAD.r
  const projY      = projAvg !== undefined ? cy(projAvg) : 0
  const projPath   = projAvg !== undefined
    ? `M ${projStartX.toFixed(1)},${pts[N-1].y.toFixed(1)} L ${projEndX.toFixed(1)},${projY.toFixed(1)}`
    : ''

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="mc_f" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(245,194,0,0.20)" />
          <stop offset="100%" stopColor="rgba(245,194,0,0)" />
        </linearGradient>
      </defs>

      {/* Season average reference line */}
      <line x1={PAD.l} y1={avgY} x2={W - PAD.r} y2={avgY}
        stroke="rgba(245,194,0,0.22)" strokeWidth="1" strokeDasharray="3,2" />

      {/* Fill under actual curve */}
      <path d={fill} fill="url(#mc_f)" />

      {/* Actual curve */}
      <path d={line} fill="none" stroke="#f5c200" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Projection dashed line */}
      {projAvg !== undefined && (
        <>
          {/* Fade zone between actual and projection */}
          <line x1={projStartX} y1={PAD.t} x2={projStartX} y2={PAD.t + iH}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <path d={projPath} fill="none" stroke="rgba(245,194,0,0.5)"
            strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round" />
          <circle cx={projEndX} cy={projY} r={3}
            fill="rgba(245,194,0,0.5)" />
        </>
      )}

      {/* Last actual data point */}
      <circle cx={pts[N-1].x} cy={pts[N-1].y} r={4}
        fill="#f5c200" stroke="rgba(245,194,0,0.3)" strokeWidth={4} />
    </svg>
  )
}

export function FullCurve({ matchAvgs, seasonAvg, metric, tapped, onTap, upcoming, recentAvg }: {
  matchAvgs: number[]; seasonAvg: number; metric: Metric
  tapped: number | null; onTap: (i: number | null) => void
  /** Upcoming matches → ghost prediction fan after the last played match (snitt only) */
  upcoming?: { date: string; opp: string }[]
  /** "If form holds" scenario value for the ghost fan */
  recentAvg?: number
}) {
  const W = 320, H = 124, PAD = { l: 30, r: 42, t: 14, b: 22 }
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b
  const cx = (i: number) => PAD.l + (i / (matchAvgs.length - 1)) * iW

  if (metric === 'alla') {
    const series = [
      { d: norm(matchAvgs),   c: '#f5c200' },
      { d: norm(RANKING_PTS), c: '#9ca5b3' },
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
  // Ghost prediction fan: compress the played matches to make room for upcoming ones
  const ghost  = metric === 'snitt' && !!upcoming?.length && recentAvg !== undefined
  const U      = ghost ? upcoming!.length : 0
  const cxG    = (i: number) => PAD.l + (i / (data.length + U - 1)) * iW
  const px     = ghost ? cxG : cx
  const pts    = data.map((v, i) => ({ x: px(i), y: cy(v) }))
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
          {!ghost && (
            <text x={W - PAD.r + 4} y={cy(seasonAvg) + 4} fill="rgba(245,194,0,0.6)" fontSize="8.5" fontWeight="bold">snitt {seasonAvg}</text>
          )}
        </>
      )}
      <path d={fill} fill={`url(#${gid}_f)`} />
      <path d={line} fill="none" stroke={`url(#${gid}_l)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Ghost prediction fan — two dashed scenarios into the upcoming matches */}
      {ghost && (() => {
        const yForm = cy(recentAvg!)
        const yAvg  = cy(seasonAvg)
        const endX  = cxG(data.length + U - 1)
        return (
          <g>
            {/* "today" separator */}
            <line x1={last.x} y1={PAD.t} x2={last.x} y2={PAD.t + iH} stroke="rgba(244,245,247,0.07)" strokeWidth="1" />
            {/* Fan area between the two scenarios */}
            <path d={`M ${last.x.toFixed(1)},${last.y.toFixed(1)} L ${endX.toFixed(1)},${yForm.toFixed(1)} L ${endX.toFixed(1)},${yAvg.toFixed(1)} Z`}
              fill="rgba(245,194,0,0.05)" />
            {/* If form holds */}
            <line x1={last.x} y1={last.y} x2={endX} y2={yForm}
              stroke="rgba(245,194,0,0.5)" strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round" />
            {/* If season average holds */}
            <line x1={last.x} y1={last.y} x2={endX} y2={yAvg}
              stroke="rgba(244,245,247,0.22)" strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round" />
            {/* Ghost match markers along the form scenario + opponent labels */}
            {upcoming!.map((u, k) => {
              const gx = cxG(data.length + k)
              const gy = last.y + (yForm - last.y) * ((k + 1) / U)
              const initials = u.opp.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
              return (
                <g key={k}>
                  <circle cx={gx} cy={gy} r={3.5} fill="#0f1216" stroke="rgba(245,194,0,0.5)" strokeWidth="1.5" />
                  <text x={gx} y={H - 4} fill="rgba(244,245,247,0.30)" fontSize="8" textAnchor="middle">{initials}</text>
                </g>
              )
            })}
            <text x={endX + 3} y={yForm + 3} fill="rgba(245,194,0,0.65)" fontSize="8" fontWeight="bold">{recentAvg}</text>
            <text x={endX + 3} y={yAvg + 3} fill="rgba(244,245,247,0.35)" fontSize="8">{seasonAvg}</text>
          </g>
        )
      })()}

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
      {!ghost && (
        <text x={W - PAD.r} y={H - 4} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="end">{MATCHES[MATCHES.length-1].date}</text>
      )}
    </svg>
  )
}
