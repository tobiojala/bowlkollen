'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Sheet } from '@/components/mockup/Sheet'
import { COLORS } from '../../data'

const { GOLD, GREEN, MUTED } = COLORS

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
    <Sheet title="VAD HÄNDER OM..." onClose={onClose}>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Dra reglaget — se hur nästa match påverkar ditt snitt
      </p>

      {/* Big numbers */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-xs mb-1" style={{ color: MUTED }}>Du snittade</p>
          <div className="num" style={{ fontSize: 52, color: GOLD, lineHeight: 1 }}>{whatIfVal}</div>
          <p className="text-xs mt-1" style={{ color: MUTED }}>i nästa match</p>
        </div>
        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.12)', fontWeight: 300 }}>→</div>
        <div className="text-right">
          <p className="text-xs mb-1" style={{ color: MUTED }}>Nytt säsongssnitt</p>
          <div className="num" style={{ fontSize: 52, lineHeight: 1, color: projDiff > 0 ? GREEN : projDiff < 0 ? '#e05555' : MUTED }}>
            {projAvg}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1">
            {projDiff > 0 ? <TrendingUp size={14} color={GREEN} /> : projDiff < 0 ? <TrendingDown size={14} color="#e05555" /> : null}
            <span className="text-sm font-bold" style={{ color: projDiff > 0 ? GREEN : projDiff < 0 ? '#e05555' : MUTED }}>
              {projDiff > 0 ? `+${projDiff}` : projDiff < 0 ? projDiff : 'oförändrat'}
            </span>
          </div>
        </div>
      </div>

      {/* Slider */}
      <input type="range" min="140" max="280" step="5" value={whatIfVal}
        onChange={e => setWhatIfVal(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: GOLD }} />
      <div className="flex justify-between text-xs mt-1.5" style={{ color: MUTED }}>
        <span>140</span>
        <span style={{ color: GOLD, fontWeight: 600 }}>Ditt snitt: {seasonAvg}</span>
        <span>280</span>
      </div>
    </Sheet>
  )
}
