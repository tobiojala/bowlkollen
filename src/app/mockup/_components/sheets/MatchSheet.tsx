'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Sheet } from '@/components/mockup/Sheet'
import { CIcon } from '@/components/mockup/StatCards'
import { MATCHES, DNA_HIGHLIGHTS, COLORS } from '../../data'

const { GOLD, GREEN, BLUE, MUTED } = COLORS

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
  const hl    = isDnaSpoke ? DNA_HIGHLIGHTS.find(h => h.idx === matchIdx) : undefined
  const total = m.games.reduce((a, b) => a + b)
  const avg   = Math.round(total / m.games.length)
  const isWin  = m.result.startsWith('W')
  const isLoss = m.result.startsWith('L')
  const resultColor = isWin ? GREEN : isLoss ? '#e05555' : MUTED

  return (
    <Sheet title={isDnaSpoke ? 'DNA — MATCHDETALJ' : 'MATCHDETALJER'} onClose={onClose}>

      {/* DNA highlight banner */}
      {hl && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-5"
          style={{ background: `${hl.color}14`, border: `1px solid ${hl.color}40` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${hl.color}20`, border: `2px solid ${hl.color}60` }}>
            <CIcon name={hl.iconName} size={20} color={hl.color} />
          </div>
          <div>
            <p className="text-base font-extrabold" style={{ color: hl.color }}>{hl.label}</p>
            {hl.sublabel && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{hl.sublabel}</p>}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-base font-bold">vs {m.opp}</p>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>{m.date}</p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: isWin ? 'rgba(93,202,165,0.15)' : isLoss ? 'rgba(224,85,85,0.15)' : 'rgba(255,255,255,0.08)',
            color: resultColor,
            border: `1px solid ${isWin ? 'rgba(93,202,165,0.3)' : isLoss ? 'rgba(224,85,85,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}>
          {m.result}
        </span>
      </div>

      {/* Scores — no boxes */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${m.games.length}, 1fr)` }}>
        {m.games.map((g, i) => {
          const c = g >= 250 ? BLUE : g >= 200 ? GOLD : MUTED
          return (
            <div key={i} className="text-center">
              <div className="num text-4xl" style={{ color: c }}>{g}</div>
              <div className="text-[9px] mt-1 tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>SPEL {i + 1}</div>
            </div>
          )
        })}
      </div>

      {/* Summary — divider separation */}
      <div className="grid grid-cols-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <p className="text-[9px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>TOTALT</p>
          <p className="num text-2xl" style={{ color: GOLD }}>{total}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>MATCHSNITT</p>
          <p className="num text-2xl" style={{ color: GOLD }}>{avg}</p>
        </div>
      </div>

      {/* DNA vs-snitt footer */}
      {isDnaSpoke && (
        <div className="flex justify-between items-center pt-4 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-xs" style={{ color: MUTED }}>Match {matchIdx + 1} av {totalMatches} denna säsong</span>
          <div className="flex items-center gap-1">
            {avg >= seasonAvg ? <TrendingUp size={12} color={GREEN} /> : <TrendingDown size={12} color="#e05555" />}
            <span className="text-xs font-bold" style={{ color: avg >= seasonAvg ? GREEN : '#e05555' }}>
              {avg >= seasonAvg ? `+${avg - seasonAvg}p` : `${avg - seasonAvg}p`} vs snitt
            </span>
          </div>
        </div>
      )}
    </Sheet>
  )
}
