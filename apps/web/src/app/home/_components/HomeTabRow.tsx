'use client'

import { motion } from 'framer-motion'
import { LayoutGrid, User, Users, Calendar, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { COLOR } from '@/lib/brand'

export type FeedFilterType = 'allt' | 'spelare' | 'lag' | 'matcher' | 'prediktion'

const FILTER_CHIPS: { id: FeedFilterType; label: string; Icon: LucideIcon }[] = [
  { id: 'allt',       label: 'Allt',       Icon: LayoutGrid },
  { id: 'spelare',    label: 'Spelare',    Icon: User       },
  { id: 'lag',        label: 'Lag',        Icon: Users      },
  { id: 'matcher',    label: 'Matcher',    Icon: Calendar   },
  { id: 'prediktion', label: 'Prediktion', Icon: Target     },
]

// Instagram-style story circles as the feed's category rail — 1:1 with the
// native StoryChips: 76px circle, lit gold ring on the active category (others
// on a muted ink ring), a glossy sheen over an inner surface disc, 30px icon,
// label below. Horizontal-scroll rail so the set can grow past the fold.
const SIZE = 76
const RING = 3

interface HomeTabRowProps {
  active: FeedFilterType
  onChange: (f: FeedFilterType) => void
}

export default function HomeTabRow({ active, onChange }: HomeTabRowProps) {
  return (
    <div
      style={{
        display: 'flex', gap: 16, alignItems: 'flex-start',
        padding: '10px 16px 14px', overflowX: 'auto',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}
      className="home-story-rail"
    >
      <style>{`.home-story-rail::-webkit-scrollbar { display: none }`}</style>
      {FILTER_CHIPS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(id)}
            aria-label={label}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              width: SIZE, flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Ring */}
            <div style={{
              position: 'relative', width: SIZE, height: SIZE, borderRadius: '50%',
              padding: RING, boxSizing: 'border-box',
              background: isActive ? COLOR.gold : COLOR.ink4,
              transition: 'background 0.16s ease',
            }}>
              {/* Glossy sheen */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0) 62%)',
              }} />
              {/* Inner disc */}
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: COLOR.surface, border: `2px solid ${COLOR.bg}`, boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={30} color={isActive ? COLOR.gold : COLOR.ink2} strokeWidth={isActive ? 2.2 : 1.7} />
              </div>
            </div>
            <span style={{
              fontSize: 12, fontWeight: isActive ? 700 : 600,
              color: isActive ? COLOR.ink : COLOR.ink3,
              letterSpacing: 0.2, transition: 'color 0.16s ease',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
