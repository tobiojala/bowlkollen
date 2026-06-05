'use client'

import { cn } from '@/lib/cn'

export type TeamTab = 'results' | 'upcoming' | 'squad' | 'community' | 'h2h'

type TabDef = { key: TeamTab; label: string; count: number }

type Props = {
  tab: TeamTab
  onTabChange: (tab: TeamTab) => void
  tabs: TabDef[]
}

export function TeamTabBar({ tab, onTabChange, tabs }: Props) {
  return (
    <div
      id="team-tabs"
      className="flex border-b border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg"
    >
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onTabChange(t.key)}
          className={cn(
            'flex-1 border-b-2 px-2 py-3 text-[13px] transition-colors [-webkit-tap-highlight-color:transparent]',
            tab === t.key
              ? 'border-gold font-bold text-gold'
              : 'border-transparent font-medium text-dark-muted',
          )}
        >
          {t.label}
          {t.count > 0 && <span className="ml-1.5 text-[10px] opacity-70">({t.count})</span>}
        </button>
      ))}
    </div>
  )
}
