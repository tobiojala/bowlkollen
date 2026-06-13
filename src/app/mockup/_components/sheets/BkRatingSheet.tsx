'use client'

import { Sheet } from '@/components/mockup/Sheet'
import { PLAYER_BK_RATING, PLAYER_MOT_FALTET, PLAYER_BK_PILLARS, COLORS } from '../../data'

const { GREEN } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

interface BkRatingSheetProps {
  bkTopPct: number
  onClose: () => void
}

export default function BkRatingSheet({ bkTopPct, onClose }: BkRatingSheetProps) {
  return (
    <Sheet title="BK Rating" subtitle="Så räknas betyget" onClose={onClose}>

      {/* Hero */}
      <div className="flex items-baseline gap-3">
        <span className="num tabular-nums" style={{ fontSize: 44, color: INK }}>{PLAYER_BK_RATING}</span>
        <span className="text-[13px] font-semibold" style={{ color: GREEN }}>Top {bkTopPct}% i Elitserien Damer</span>
      </div>

      {/* Mot fältet — the core concept gets prime placement */}
      <div className="rounded-2xl px-4 py-3.5 mt-4" style={{ background: 'rgba(244,245,247,0.05)' }}>
        <div className="flex items-baseline gap-2.5">
          <span className="num tabular-nums" style={{ fontSize: 24, color: GREEN }}>+{PLAYER_MOT_FALTET}</span>
          <span className="text-[13px] font-bold" style={{ color: INK }}>mot fältet</span>
        </div>
        <p className="text-[13px] mt-1.5" style={{ color: INK2, lineHeight: 1.55 }}>
          Varje match jämförs Sara med <span style={{ color: INK, fontWeight: 600 }}>alla som bowlade samma
          banor, samma olja, samma kväll</span>. Hon slår förhållandena med 12 pinnar i snitt —
          det är grunden i betyget, inte råa poäng.
        </p>
      </div>

      {/* Pillars */}
      <div className="mt-6">
        {PLAYER_BK_PILLARS.map((p, i) => (
          <div key={p.key} className={`py-4 ${i > 0 ? 'border-t' : ''}`}
            style={i > 0 ? { borderColor: 'rgba(244,245,247,0.07)' } : {}}>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[15px] font-bold" style={{ color: INK }}>{p.label}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                style={{ background: 'rgba(244,245,247,0.07)', color: INK3 }}>
                {p.weight}%
              </span>
              <span className="num tabular-nums ml-auto" style={{ fontSize: 20, color: INK }}>{p.value}</span>
            </div>
            <div className="text-[12px] mb-2.5" style={{ color: INK4 }}>{p.desc}</div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(244,245,247,0.07)' }}>
              <div className="h-full rounded-full" style={{
                width: `${p.value}%`,
                background: 'rgba(244,245,247,0.65)',
                animation: `xp-fill 0.9s cubic-bezier(0.34,1.2,0.64,1) ${0.1 + i * 0.08}s both`,
                ['--xp-w' as string]: `${p.value}%`,
              }} />
            </div>
            <p className="text-[13px] mt-2.5" style={{ color: INK2, lineHeight: 1.5 }}>{p.sentence}</p>
          </div>
        ))}
      </div>

      {/* Source weighting footnote */}
      <div className="rounded-2xl px-4 py-3.5 mt-2" style={{ background: 'rgba(244,245,247,0.04)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: INK3 }}>
          Vad räknas in
        </div>
        {[
          { label: 'Sanktionerat (BITS) — ligaspel & sanktionerade tävlingar', w: '×1,0' },
          { label: 'Verifierade tävlingar — körda via Bowlkollen eller hall',  w: '×0,5' },
          { label: 'Självrapporterat — påverkar endast Form',                  w: '×0,2' },
        ].map(s => (
          <div key={s.w} className="flex items-baseline justify-between gap-3 py-1">
            <span className="text-[12px]" style={{ color: INK2 }}>{s.label}</span>
            <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: INK3 }}>{s.w}</span>
          </div>
        ))}
        <p className="text-[12px] mt-2" style={{ color: INK4, lineHeight: 1.5 }}>
          Allt vägt mot fältet — betyget går inte att blåsa upp med lätta banor.
        </p>
      </div>
    </Sheet>
  )
}
