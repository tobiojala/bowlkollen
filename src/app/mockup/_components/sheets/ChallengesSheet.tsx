'use client'

import { Sheet } from '@/components/mockup/Sheet'
import { CHALLENGES, COLORS } from '../../data'

const { GREEN, GOLD, MUTED } = COLORS
const CIRCUM = 201.1

interface ChallengesSheetProps {
  onClose: () => void
}

export default function ChallengesSheet({ onClose }: ChallengesSheetProps) {
  return (
    <Sheet title="UTMANINGAR" onClose={onClose}>
      <div>
        {CHALLENGES.map((c, i) => {
          const ringColor = c.done ? GREEN : c.progress >= 85 ? GOLD : 'rgba(245,194,0,0.65)'
          return (
            <div key={i} className={`flex items-center gap-4 py-4 ${i > 0 ? 'border-t' : ''}`}
              style={i > 0 ? { borderColor: 'rgba(255,255,255,0.08)' } : {}}>
              {/* Arc progress ring */}
              <svg width={72} height={72} viewBox="0 0 80 80" className="shrink-0">
                <circle cx={40} cy={40} r={32} fill="none"
                  stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
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
                    fontWeight="900" fontFamily="system-ui">✓</text>
                ) : (
                  <>
                    <text x={40} y={38} textAnchor="middle" fontSize={19}
                      fill={c.progress >= 85 ? GOLD : 'rgba(255,255,255,0.75)'}
                      fontWeight="900" fontFamily="'Barlow Condensed', system-ui">{c.progress}</text>
                    <text x={40} y={51} textAnchor="middle" fontSize={9}
                      fill="rgba(255,255,255,0.28)" fontWeight="700" fontFamily="system-ui">%</text>
                  </>
                )}
              </svg>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold ${c.done ? '' : ''}`}
                  style={{ color: c.done ? GREEN : 'rgba(255,255,255,0.90)' }}>
                  {c.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{c.desc}</p>
                {!c.done && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${c.progress}%`,
                        background: c.progress >= 85
                          ? 'linear-gradient(90deg, rgba(245,194,0,0.7), #f5c200)'
                          : 'linear-gradient(90deg, rgba(245,194,0,0.4), #f5c200)',
                      }} />
                    </div>
                    <span className="text-xs shrink-0" style={{ color: MUTED }}>{c.cur}</span>
                    {c.progress >= 85 && (
                      <span className="challenge-urgent text-[9px] font-bold px-1.5 py-0.5 rounded-lg shrink-0"
                        style={{ color: GOLD, background: 'rgba(245,194,0,0.12)',
                          border: '1px solid rgba(245,194,0,0.25)', letterSpacing: 0.5 }}>
                        NÄRA
                      </span>
                    )}
                  </div>
                )}
              </div>

              {c.done && (
                <span className="text-[10px] font-bold shrink-0" style={{ color: GREEN }}>✓ Klar</span>
              )}
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
