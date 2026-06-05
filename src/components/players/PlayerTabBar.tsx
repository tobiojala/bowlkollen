'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

export type PlayerTab = 'oversikt' | 'matchlogg'

type Props = {
  tab: PlayerTab
  onTabChange: (tab: PlayerTab) => void
  matchCount: number
}

export function PlayerTabBar({ tab, onTabChange, matchCount }: Props) {
  return (
    <div className="flex border-b border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
      {(
        [
          { key: 'oversikt' as const, label: 'Översikt' },
          { key: 'matchlogg' as const, label: 'Matchlogg', count: matchCount },
        ] as const
      ).map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onTabChange(t.key)}
          className={cn(
            'relative flex-1 cursor-pointer border-none bg-transparent px-2 py-3 text-[13px] [-webkit-tap-highlight-color:transparent]',
            tab === t.key ? 'font-bold text-gold' : 'font-medium text-dark-muted',
          )}
        >
          {tab === t.key && (
            <motion.div
              layoutId="player-tab-capsule"
              transition={SPRING}
              className="absolute right-0 bottom-0 left-0 h-0.5 rounded-sm bg-gold"
            />
          )}
          {t.label}
          {'count' in t && t.count > 0 && (
            <span className="ml-1.5 text-[10px] opacity-60">({t.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
