'use client'

import { useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui'
import {
  sllmPlayerColors,
  sllmPlayerInitials,
  type SllmPlayer,
} from '@/lib/sllm-data'
import { sllmPlayerAvatarStyle, sllmPlayerChipStyle } from '@/lib/sllm-ui'

type PlayerFilter = 'all' | 'swe' | 'int'

type Props = {
  players: SllmPlayer[]
  apiReady: boolean
}

const FILTERS: { key: PlayerFilter; label: string }[] = [
  { key: 'all', label: 'Alla' },
  { key: 'swe', label: 'Svenska' },
  { key: 'int', label: 'Internationella' },
]

export function SLLMPlayerList({ players, apiReady }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<PlayerFilter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = players.filter(p => {
    const q = search.toLowerCase()
    const ok =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.club.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q)
    const f =
      filter === 'all' ||
      (filter === 'swe' && p.country === 'SWE') ||
      (filter === 'int' && p.country !== 'SWE')
    return ok && f
  })

  return (
    <div className="px-4">
      <div className="mb-3.5 flex items-center gap-2">
        <span className="text-[10px] font-extrabold tracking-widest text-dark-muted">
          SPELLISTA
        </span>
        {!apiReady && (
          <span className="rounded-lg border border-gold/25 bg-gold/10 px-2 py-0.5 text-[9px] font-bold text-gold">
            DEMO
          </span>
        )}
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Sök spelare, klubb eller land..."
        className={cn(
          'mb-2 box-border w-full rounded-[10px] border border-light-border px-3.5 py-2.5 text-[13px] outline-none',
          'text-light-text placeholder:text-dark-muted dark:border-dark-border dark:text-dark-text',
          dark ? 'bg-white/[0.05]' : 'bg-black/[0.03]',
        )}
      />

      <div className="mb-3.5 flex gap-1.5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'flex-1 cursor-pointer rounded-lg border-none py-[7px] text-[11px] font-bold',
              '[-webkit-tap-highlight-color:transparent]',
              filter === key
                ? 'bg-gold text-[#1a1400]'
                : cn(
                    'text-dark-muted',
                    dark ? 'bg-white/[0.06]' : 'bg-black/[0.05]',
                  ),
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mb-2.5 text-[10px] text-dark-muted">{filtered.length} spelare</p>

      {filtered.length > 0 ? (
        <Card className="overflow-hidden p-0">
          {filtered.map((p, i) => (
            <SLLMPlayerRow
              key={`${p.name}-${i}`}
              player={p}
              dark={dark}
              isFirst={i === 0}
              isOpen={expanded === p.name}
              onToggle={() =>
                p.squads.length > 0 && setExpanded(expanded === p.name ? null : p.name)
              }
            />
          ))}
        </Card>
      ) : (
        <p className="px-4 py-8 text-center text-[13px] text-dark-muted">
          Inga spelare matchar sökningen
        </p>
      )}

      {!apiReady && (
        <div className="mt-3 rounded-[10px] border border-gold/20 bg-gold/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-dark-muted">
          Spellistan ovan är exempeldata. Riktiga anmälningar visas när API-avtal med
          bowlres.se är på plats.{' '}
          <a
            href="https://sllm.bowlres.se/allplayers.php?contestid=107"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold no-underline"
          >
            Se original →
          </a>
        </div>
      )}
    </div>
  )
}

function SLLMPlayerRow({
  player: p,
  dark,
  isFirst,
  isOpen,
  onToggle,
}: {
  player: SllmPlayer
  dark: boolean
  isFirst: boolean
  isOpen: boolean
  onToggle: () => void
}) {
  const pc = sllmPlayerColors(p.name, dark)
  const ini = sllmPlayerInitials(p.name)
  const isSwe = p.country === 'SWE'
  const expandable = p.squads.length > 0

  return (
    <div className={cn(!isFirst && 'border-t border-light-border dark:border-dark-border')}>
      <div
        role={expandable ? 'button' : undefined}
        tabIndex={expandable ? 0 : undefined}
        onClick={onToggle}
        onKeyDown={e => {
          if (expandable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onToggle()
          }
        }}
        className={cn(
          'flex items-center gap-3 px-3.5 py-3 [-webkit-tap-highlight-color:transparent]',
          expandable && 'cursor-pointer',
        )}
      >
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={sllmPlayerAvatarStyle(pc)}
        >
          {ini}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-light-text dark:text-dark-text">
            {p.name}
          </div>
          <div className="mt-px truncate text-[11px] text-dark-muted">{p.club}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              'rounded-md px-[7px] py-0.5 text-[10px] font-bold',
              !isSwe &&
                'border border-light-border text-dark-muted dark:border-dark-border',
            )}
            style={isSwe ? sllmPlayerChipStyle(pc) : undefined}
          >
            {p.country}
          </span>
          {expandable && (
            <span className="text-[10px] text-dark-muted">{isOpen ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {isOpen && p.squads.length > 0 && (
        <div
          className={cn(
            'border-t border-light-border px-3.5 py-2.5 dark:border-dark-border',
            dark ? 'bg-white/[0.02]' : 'bg-black/[0.02]',
          )}
        >
          <div className="mb-2 text-[9px] font-extrabold tracking-wide text-dark-muted">
            SQUADS
          </div>
          <div className="flex flex-col gap-1.5">
            {p.squads.map((sq, j) => (
              <a
                key={j}
                href={sq.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gold no-underline"
              >
                <span className="inline-block size-1 shrink-0 rounded-full bg-gold" />
                {sq.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
