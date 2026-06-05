'use client'

import { useRef } from 'react'
import { Search } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { compareTeamBadgeStyle, compareTeamColors, teamInitials } from '@/lib/compare-ui'

export type CompareSearchTeam = { id: string; name: string; city: string | null }

type Props = {
  id1: string
  query: string
  onQueryChange: (q: string) => void
  results: CompareSearchTeam[]
}

export function TeamCompareSearch({ id1, query, onQueryChange, results }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mx-auto max-w-app">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5 rounded-[14px] border border-light-border bg-light-card px-3.5 py-[11px] dark:border-dark-border dark:bg-dark-card">
          <Search size={16} className="shrink-0 text-dark-muted" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Sök ett lag att jämföra med..."
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-light-text outline-none dark:text-dark-text"
          />
        </div>
      </div>

      {results.length > 0 && (
        <div className="mx-4 overflow-hidden rounded-2xl border border-light-border dark:border-dark-border">
          {results.map((t, i) => {
            const col = compareTeamColors(t.name, dark)
            const ini = teamInitials(t.name)
            return (
              <a
                key={t.id}
                href={`/compare/teams/${id1}/${t.id}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 no-underline transition-colors',
                  'hover:bg-light-card dark:hover:bg-dark-card',
                  i > 0 && 'border-t border-light-border dark:border-dark-border',
                )}
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-extrabold"
                  style={compareTeamBadgeStyle(col, 'sm')}
                >
                  {ini}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-light-text dark:text-dark-text">
                    {shortName(t.name)}
                  </div>
                  {t.city && (
                    <div className="mt-px text-[11px] text-dark-muted">{t.city}</div>
                  )}
                </div>
                <span className="text-[13px] text-dark-muted">›</span>
              </a>
            )
          })}
        </div>
      )}

      {query.trim() && results.length === 0 && (
        <p className="px-5 py-8 text-center text-[13px] text-dark-muted">Inga lag hittades</p>
      )}

      {!query.trim() && (
        <p className="px-5 py-8 text-center text-[13px] text-dark-muted">Sök på lagnamn eller stad</p>
      )}
    </div>
  )
}
