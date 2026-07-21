'use client'

import { TrendingUp } from 'lucide-react'
import { Sheet } from '@/components/mockup/Sheet'
import { COLORS } from '../../data'
import { smooth } from '../../helpers'

const { GOLD, GREEN } = COLORS
const INK  = '#f4f5f7'
const INK3 = 'rgba(244,245,247,0.40)'

interface DuellSheetProps {
  matchAvgs: number[]
  /** Previous-season per-match averages, plotted as the ghost line. */
  lastSeasonAvgs: number[]
  /** First and last match dates for the axis labels. */
  firstDate: string
  lastDate: string
  onClose: () => void
}

export default function DuellSheet({ matchAvgs, lastSeasonAvgs, firstDate, lastDate, onClose }: DuellSheetProps) {
  const W = 320, H = 110, PAD = { l: 28, r: 42, t: 10, b: 20 }
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b
  const all = [...matchAvgs, ...lastSeasonAvgs]
  const mnV = Math.floor(Math.min(...all) / 10) * 10 - 5
  const mxV = Math.ceil(Math.max(...all) / 10) * 10 + 5
  const cx = (i: number) => PAD.l + (i / (matchAvgs.length - 1)) * iW
  const cy = (v: number) => PAD.t + iH - ((v - mnV) / (mxV - mnV)) * iH
  const thisPts = matchAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const lastPts = lastSeasonAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const thisAvg = Math.round(matchAvgs.reduce((a, b) => a + b) / matchAvgs.length)
  const lastAvg = Math.round(lastSeasonAvgs.reduce((a, b) => a + b) / lastSeasonAvgs.length)

  return (
    <Sheet title="Säsongsduell" subtitle="Den här säsongen mot förra" onClose={onClose}>

      {/* Hero — the improvement IS the story */}
      <div className="flex items-baseline gap-3 mt-1 mb-5">
        <span className="num tabular-nums" style={{ fontSize: 40, color: GREEN }}>+{thisAvg - lastAvg}</span>
        <span className="text-[13px]" style={{ color: INK3 }}>poäng bättre snitt än förra säsongen</span>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        <path d={smooth(lastPts)} fill="none" stroke="rgba(244,245,247,0.22)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,3" />
        <path d={smooth(thisPts)} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={thisPts[thisPts.length-1].x} cy={thisPts[thisPts.length-1].y} r={5} fill={GOLD} stroke="rgba(245,194,0,0.3)" strokeWidth="5" />
        <circle cx={lastPts[lastPts.length-1].x} cy={lastPts[lastPts.length-1].y} r={3} fill="rgba(244,245,247,0.35)" />
        <text x={W - PAD.r + 4} y={cy(matchAvgs[matchAvgs.length-1]) + 4} fill={GOLD} fontSize="9" fontWeight="bold">i år</text>
        <text x={W - PAD.r + 4} y={cy(lastSeasonAvgs[lastSeasonAvgs.length-1]) + 4} fill="rgba(244,245,247,0.45)" fontSize="9">förra</text>
        <text x={PAD.l} y={H - 3} fill="rgba(244,245,247,0.24)" fontSize="9" textAnchor="middle">{firstDate}</text>
        <text x={W - PAD.r} y={H - 3} fill="rgba(244,245,247,0.24)" fontSize="9" textAnchor="end">{lastDate}</text>
      </svg>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4" style={{ borderTop: '1px solid rgba(244,245,247,0.07)' }}>
        <div className="text-center py-3">
          <div className="num text-3xl tabular-nums" style={{ color: INK }}>{thisAvg}</div>
          <div className="text-[11px] mt-1.5" style={{ color: INK3 }}>Denna säsong</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1">
          <TrendingUp size={16} color={GREEN} />
          <div className="text-base font-black tabular-nums" style={{ color: GREEN }}>+{thisAvg - lastAvg}</div>
        </div>
        <div className="text-center py-3">
          <div className="num text-3xl tabular-nums" style={{ color: INK3 }}>{lastAvg}</div>
          <div className="text-[11px] mt-1.5" style={{ color: INK3 }}>Förra säsongen</div>
        </div>
      </div>
    </Sheet>
  )
}
