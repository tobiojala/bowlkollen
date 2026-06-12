'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Sheet } from '@/components/mockup/Sheet'
import { CIcon } from '@/components/mockup/StatCards'
import { MATCHES, DNA_HIGHLIGHTS, COLORS } from '../../data'

const { GOLD, GREEN, RED } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

interface MatchSheetProps {
  /** Index of the tapped match */
  matchIdx: number
  /** Total number of matches (for the DNA detail "Match X av Y") */
  totalMatches: number
  seasonAvg: number
  /** If true, this is a DNA spoke tap (shows highlight banner + vs-snitt footer) */
  isDnaSpoke?: boolean
  onClose: () => void
}

export default function MatchSheet({ matchIdx, totalMatches, seasonAvg, isDnaSpoke, onClose }: MatchSheetProps) {
  const m     = MATCHES[matchIdx]
  const total = m.games.reduce((a, b) => a + b)
  const avg   = Math.round(total / m.games.length)
  const hl    = isDnaSpoke ? DNA_HIGHLIGHTS.find(h => h.idx === matchIdx) : undefined
  const isWin  = m.result.startsWith('W')
  const isLoss = m.result.startsWith('L')
  const resultColor = isWin ? GREEN : isLoss ? RED : INK3

  const scoreColor  = (g: number) => g >= 250 ? GOLD : g >= 200 ? INK : INK3
  const scoreWeight = (g: number) => g >= 250 ? 900 : g >= 200 ? 700 : 400

  return (
    <Sheet title={`vs ${m.opp}`} subtitle={m.date} onClose={onClose}>

      {/* Result + total — the hero of a match */}
      <div className="flex justify-between items-center mb-6">
        <span className="px-3.5 py-1.5 rounded-full text-[13px] font-bold"
          style={{
            background: isWin ? 'rgba(93,202,165,0.12)' : isLoss ? 'rgba(224,85,85,0.12)' : 'rgba(244,245,247,0.06)',
            color: resultColor,
          }}>
          {m.result}
        </span>
        <div className="text-right">
          <span className="num tabular-nums" style={{ fontSize: 34, color: avg >= seasonAvg ? INK : INK2 }}>{total}</span>
          <span className="text-[13px] ml-2" style={{ color: INK3 }}>totalt</span>
        </div>
      </div>

      {/* DNA highlight banner */}
      {hl && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-5"
          style={{ background: `${hl.color}14` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${hl.color}20` }}>
            <CIcon name={hl.iconName} size={20} color={hl.color} />
          </div>
          <div>
            <p className="text-[15px] font-extrabold" style={{ color: hl.color }}>{hl.label}</p>
            {hl.sublabel && <p className="text-[12px] mt-0.5" style={{ color: INK3 }}>{hl.sublabel}</p>}
          </div>
        </div>
      )}

      {/* Scores */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${m.games.length}, 1fr)` }}>
        {m.games.map((g, i) => (
          <div key={i} className="text-center">
            <div className="num text-4xl tabular-nums" style={{ color: scoreColor(g), fontWeight: scoreWeight(g) }}>{g}</div>
            <div className="text-[11px] mt-1.5" style={{ color: INK4 }}>Spel {i + 1}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid rgba(244,245,247,0.07)' }}>
        <span className="text-[12px]" style={{ color: INK3 }}>
          {isDnaSpoke ? `Match ${matchIdx + 1} av ${totalMatches} denna säsong` : `Matchsnitt ${avg}`}
        </span>
        <div className="flex items-center gap-1">
          {avg >= seasonAvg ? <TrendingUp size={12} color={GREEN} /> : <TrendingDown size={12} color={RED} />}
          <span className="text-[12px] font-bold tabular-nums" style={{ color: avg >= seasonAvg ? GREEN : RED }}>
            {avg >= seasonAvg ? `+${avg - seasonAvg}p` : `${avg - seasonAvg}p`} vs snitt
          </span>
        </div>
      </div>
    </Sheet>
  )
}
