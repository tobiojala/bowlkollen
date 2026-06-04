'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'
import { TavlingCard } from '@/components/tavlingar/TavlingCard'
import {
  TAVLINGAR,
  TAVLING_FILTERS,
  TAVLING_SPRING,
  tavlingSectionTitle,
  type TavlingFilter,
} from '@/lib/tavlingar-data'

export default function TavlingarPage() {
  const [filter, setFilter] = useState<TavlingFilter>('alla')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tav_favorites')
      if (saved) setFavorites(new Set(JSON.parse(saved)))
    } catch {
      /* ignore */
    }
  }, [])

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem('tav_favorites', JSON.stringify([...next]))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const pagaendeCount = TAVLINGAR.filter(t => t.status === 'pagaende').length
  const kommandeCount = TAVLINGAR.filter(t => t.status === 'kommande').length

  const filtered = TAVLINGAR.filter(t =>
    filter === 'alla' ? t.status !== 'avslutad' : t.status === filter,
  )
  const favList = TAVLINGAR.filter(t => favorites.has(t.id))

  return (
    <main className="min-h-screen bg-light-bg font-sans text-light-text dark:bg-dark-bg dark:text-dark-text">
      <div className="flex gap-4 px-4 pt-3.5 pb-2.5">
        <span className="text-[11px] text-dark-muted">
          <span className="font-extrabold text-gold">{pagaendeCount}</span> pågående
        </span>
        <span className="text-[11px] text-dark-muted">
          <span className="font-extrabold text-gold">{kommandeCount}</span> kommande
        </span>
      </div>

      <div className="sticky top-14 z-30 border-b border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
        <div className="flex gap-1.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none]">
          {TAVLING_FILTERS.map(f => {
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'shrink-0 cursor-pointer rounded-full border px-3.5 py-1 text-[11px] font-bold whitespace-nowrap',
                  '[-webkit-tap-highlight-color:transparent]',
                  isActive
                    ? 'border-gold bg-gold text-[#1a1400]'
                    : 'border-light-border text-dark-muted dark:border-dark-border',
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mx-auto max-w-app pb-12">
        <AnimatePresence>
          {favList.length > 0 && filter === 'alla' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={TAVLING_SPRING}
            >
              <div className="flex items-center gap-2 border-b border-light-border px-4 pt-4 pb-1 dark:border-dark-border">
                <Star size={12} fill="#f5c200" color="#f5c200" />
                <span className="text-[10px] font-extrabold tracking-widest text-dark-muted">
                  MINA FAVORITER
                </span>
              </div>
              {favList.map(t => (
                <TavlingCard
                  key={t.id}
                  t={t}
                  isFavorite={favorites.has(t.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
              <div className="my-2 h-px bg-light-border dark:bg-dark-border" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 px-4 pt-3.5 pb-1">
          <div className="size-[5px] shrink-0 rotate-45 bg-gold" />
          <span className="text-[10px] font-extrabold tracking-widest text-dark-muted">
            {tavlingSectionTitle(filter)}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={TAVLING_SPRING}
          >
            {filtered.length === 0 ? (
              <p className="px-6 py-12 text-center text-[13px] text-dark-muted">
                Inga tävlingar i den här kategorin
              </p>
            ) : (
              filtered.map(t => (
                <TavlingCard
                  key={t.id}
                  t={t}
                  isFavorite={favorites.has(t.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
