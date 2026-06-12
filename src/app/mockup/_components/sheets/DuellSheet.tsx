'use client'

import { TrendingUp } from 'lucide-react'
import { Sheet } from '@/components/mockup/Sheet'
import { MATCHES, LAST_SEASON, COLORS } from '../../data'
import { smooth } from '../../helpers'

const { GOLD, GREEN, MUTED } = COLORS

interface DuellSheetProps {
  matchAvgs: number[]
  onClose: () => void
}

export default function DuellSheet({ matchAvgs, onClose }: DuellSheetProps) {
  const W = 320, H = 110, PAD = { l: 28, r: 42, t: 10, b: 20 }
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b
  const all = [...matchAvgs, ...LAST_SEASON]
  const mnV = Math.floor(Math.min(...all) / 10) * 10 - 5
  const mxV = Math.ceil(Math.max(...all) / 10) * 10 + 5
  const cx = (i: number) => PAD.l + (i / (matchAvgs.length - 1)) * iW
  const cy = (v: number) => PAD.t + iH - ((v - mnV) / (mxV - mnV)) * iH
  const thisPts = matchAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const lastPts = LAST_SEASON.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const thisAvg = Math.round(matchAvgs.reduce((a, b) => a + b) / matchAvgs.length)
  const lastAvg = Math.round(LAST_SEASON.reduce((a, b) => a + b) / LAST_SEASON.length)

  return (
    <Sheet title="SÄSONGSDUELL" onClose={onClose}>
      <p className="text-sm mb-4" style={{ color: MUTED }}>Den här säsongen vs förra säsongen</p>

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

      {/* Summary — dividers not boxes */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-center py-3">
          <div className="num text-3xl" style={{ color: GOLD }}>{thisAvg}</div>
          <div className="text-[9px] mt-1 tracking-widest" style={{ color: MUTED }}>DENNA SÄSONG</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1">
          <TrendingUp size={16} color={GREEN} />
          <div className="text-base font-black" style={{ color: GREEN }}>+{thisAvg - lastAvg}</div>
        </div>
        <div className="text-center py-3">
          <div className="num text-3xl" style={{ color: 'rgba(160,175,200,0.6)' }}>{lastAvg}</div>
          <div className="text-[9px] mt-1 tracking-widest" style={{ color: MUTED }}>FÖRRA SÄSONGEN</div>
        </div>
      </div>
    </Sheet>
  )
}
