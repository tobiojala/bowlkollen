'use client'

import { motion } from 'framer-motion'
import { List, User, Users, Calendar, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { COLOR } from '@/lib/brand'

export type FeedFilterType = 'allt' | 'spelare' | 'lag' | 'matcher' | 'prediktion'

const FILTER_CHIPS: { id: FeedFilterType; label: string; Icon: LucideIcon }[] = [
  { id: 'allt',       label: 'Allt',       Icon: List     },
  { id: 'spelare',    label: 'Spelare',    Icon: User     },
  { id: 'lag',        label: 'Lag',        Icon: Users    },
  { id: 'matcher',    label: 'Matcher',    Icon: Calendar },
  { id: 'prediktion', label: 'Prediktion', Icon: Target   },
]


interface HomeTabRowProps {
  active: FeedFilterType
  onChange: (f: FeedFilterType) => void
}

export default function HomeTabRow({ active, onChange }: HomeTabRowProps) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          padding: '10px 16px 14px',
        }}
      >
        {FILTER_CHIPS.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.88 }}
              onClick={() => onChange(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: isActive ? 'rgba(245,194,0,0.10)' : COLOR.surface,
                border: isActive ? `2px solid ${COLOR.gold}` : `2px solid transparent`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.16s ease, background 0.16s ease',
              }}>
                <Icon
                  size={22}
                  color={isActive ? COLOR.gold : COLOR.ink2}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
              </div>
              <span style={{
                fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? COLOR.gold : COLOR.ink2,
                letterSpacing: 0.2, transition: 'color 0.16s ease',
              }}>
                {label}
              </span>
            </motion.button>
          )
        })}

      </div>
    </>
  )
}
