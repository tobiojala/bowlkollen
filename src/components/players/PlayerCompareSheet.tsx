'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

type Props = {
  playerId: string
  playerFirstName: string
  compareQuery: string
  compareResults: { id: string; name: string }[]
  searching: boolean
  onClose: () => void
  onQueryChange: (q: string) => void
  dark: boolean
}

export function PlayerCompareSheet({
  playerId,
  playerFirstName,
  compareQuery,
  compareResults,
  searching,
  onClose,
  onQueryChange,
  dark,
}: Props) {
  return (
    <>
      <button
        type="button"
        aria-label="Stäng"
        onClick={onClose}
        className="fixed inset-0 z-[99] bg-black/55"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={SPRING}
        className={cn(
          'fixed right-0 bottom-0 left-0 z-[100] mx-auto max-w-app rounded-t-[20px] px-5 pt-5 pb-10',
          dark ? 'bg-[#131e2e]' : 'bg-white',
        )}
      >
        <div
          className={cn(
            'mx-auto mb-5 h-1 w-9 rounded-sm',
            dark ? 'bg-white/15' : 'bg-black/15',
          )}
        />
        <p className="text-[13px] font-extrabold bk-text-primary">Head-to-Head</p>
        <p className="mt-1 mb-4 text-xs text-dark-muted">
          Sök en spelare att jämföra med <span className="font-bold text-gold">{playerFirstName}</span>
        </p>
        <input
          autoFocus
          value={compareQuery}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Sök spelarnamn..."
          className="box-border w-full rounded-xl border border-gold/30 bg-black/5 px-3.5 py-2.75 text-sm bk-text-primary outline-none dark:bg-white/6"
        />
        <div className="mt-2.5 flex flex-col gap-0.5">
          {searching && (
            <p className="py-3 text-center text-xs text-dark-muted">Söker...</p>
          )}
          {!searching && compareQuery.length >= 2 && compareResults.length === 0 && (
            <p className="py-3 text-center text-xs text-dark-muted">Inga spelare hittades</p>
          )}
          {compareResults.map(op => (
            <Link
              key={op.id}
              href={`/compare/${playerId}/${op.id}`}
              className="flex items-center gap-3 rounded-xl border border-light-border bg-black/3 px-3 py-2.5 no-underline dark:border-dark-border dark:bg-white/4"
            >
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/12 text-[11px] font-extrabold text-gold">
                {op.name
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span className="text-sm font-semibold bk-text-primary">{op.name}</span>
              <span className="ml-auto text-base text-gold">⚔</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </>
  )
}
