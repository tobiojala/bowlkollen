'use client'

import { Sheet } from '@/components/mockup/Sheet'
import { CHALLENGES, COLORS } from '../../data'

const { GREEN, GOLD } = COLORS
const INK  = '#f4f5f7'
const INK3 = 'rgba(244,245,247,0.40)'
const CIRCUM = 201.1

interface ChallengesSheetProps {
  onClose: () => void
}

export default function ChallengesSheet({ onClose }: ChallengesSheetProps) {
  const doneCount = CHALLENGES.filter(c => c.done).length
  return (
    <Sheet title="Utmaningar" subtitle={`${doneCount} av ${CHALLENGES.length} klara denna säsong`} onClose={onClose}>
      <div>
        {CHALLENGES.map((c, i) => {
          // Gold budget: only a nearly-finished challenge earns gold
          const near = !c.done && c.progress >= 85
          const ringColor = c.done ? GREEN : near ? GOLD : 'rgba(244,245,247,0.45)'
          return (
            <div key={i} className={`flex items-center gap-4 py-4 ${i > 0 ? 'border-t' : ''}`}
              style={i > 0 ? { borderColor: 'rgba(244,245,247,0.07)' } : {}}>
              {/* Arc progress ring */}
              <svg width={64} height={64} viewBox="0 0 80 80" className="shrink-0">
                <circle cx={40} cy={40} r={32} fill="none"
                  stroke="rgba(244,245,247,0.07)" strokeWidth={6} />
                <circle cx={40} cy={40} r={32} fill="none"
                  stroke={ringColor}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUM}
                  strokeDashoffset={c.done ? 0 : CIRCUM * (1 - c.progress / 100)}
                  transform="rotate(-90 40 40)"
                  style={{ animation: `arc-fill 1.2s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.1}s both` }}
                />
                {c.done ? (
                  <text x={40} y={47} textAnchor="middle" fontSize={24} fill={GREEN}
                    fontWeight="900" fontFamily="inherit">✓</text>
                ) : (
                  <>
                    <text x={40} y={39} textAnchor="middle" fontSize={20}
                      fill={near ? GOLD : INK}
                      fontWeight="800" fontFamily="inherit">{c.progress}</text>
                    <text x={40} y={52} textAnchor="middle" fontSize={10}
                      fill="rgba(244,245,247,0.30)" fontWeight="700" fontFamily="inherit">%</text>
                  </>
                )}
              </svg>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold" style={{ color: c.done ? GREEN : INK }}>
                    {c.title}
                  </p>
                  {near && (
                    <span className="challenge-urgent text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: GOLD, background: 'rgba(245,194,0,0.12)' }}>
                      Nära
                    </span>
                  )}
                </div>
                <p className="text-[13px] mt-1" style={{ color: INK3 }}>{c.desc}</p>
                <p className="text-[12px] mt-1 tabular-nums" style={{ color: 'rgba(244,245,247,0.55)' }}>{c.cur}</p>
              </div>

              {c.done && (
                <span className="text-[12px] font-bold shrink-0" style={{ color: GREEN }}>Klar</span>
              )}
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
