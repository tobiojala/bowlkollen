'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Sheet } from '@/components/mockup/Sheet'
import { COLORS } from '../../data'

const { GOLD, GREEN, RED } = COLORS
const INK  = '#f4f5f7'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

interface WhatIfSheetProps {
  seasonAvg: number
  totalSum: number
  totalGames: number
  onClose: () => void
}

export default function WhatIfSheet({ seasonAvg, totalSum, totalGames, onClose }: WhatIfSheetProps) {
  const [whatIfVal, setWhatIfVal] = useState(210)

  const projAvg = Math.round((totalSum + whatIfVal * 4) / (totalGames + 4))
  const projDiff = projAvg - seasonAvg

  return (
    <Sheet title="Vad händer om..." subtitle="Dra reglaget — se hur nästa match påverkar ditt snitt" onClose={onClose}>

      {/* Big numbers */}
      <div className="flex items-center justify-between mt-2 mb-7">
        <div>
          <p className="text-[12px] mb-1.5" style={{ color: INK3 }}>Du snittar</p>
          <div className="num tabular-nums" style={{ fontSize: 52, color: INK }}>{whatIfVal}</div>
          <p className="text-[12px] mt-1.5" style={{ color: INK3 }}>i nästa match</p>
        </div>
        <div style={{ fontSize: 28, color: INK4, fontWeight: 300 }}>→</div>
        <div className="text-right">
          <p className="text-[12px] mb-1.5" style={{ color: INK3 }}>Nytt säsongssnitt</p>
          <div className="num tabular-nums" style={{ fontSize: 52, color: projDiff > 0 ? GREEN : projDiff < 0 ? RED : INK3 }}>
            {projAvg}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1.5">
            {projDiff > 0 ? <TrendingUp size={14} color={GREEN} /> : projDiff < 0 ? <TrendingDown size={14} color={RED} /> : null}
            <span className="text-[13px] font-bold" style={{ color: projDiff > 0 ? GREEN : projDiff < 0 ? RED : INK3 }}>
              {projDiff > 0 ? `+${projDiff}` : projDiff < 0 ? projDiff : 'oförändrat'}
            </span>
          </div>
        </div>
      </div>

      {/* Slider — the one interactive accent */}
      <input type="range" min="140" max="280" step="5" value={whatIfVal}
        onChange={e => setWhatIfVal(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: GOLD, height: 28 }} />
      <div className="flex justify-between text-[12px] mt-1.5 tabular-nums" style={{ color: INK4 }}>
        <span>140</span>
        <span style={{ color: INK3, fontWeight: 600 }}>Ditt snitt: {seasonAvg}</span>
        <span>280</span>
      </div>
    </Sheet>
  )
}
