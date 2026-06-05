'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FileText, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FilterChip } from '@/components/ui'
import {
  oilCategoryDotStyle,
  oilCategoryLabelStyle,
  oilProfileAccentStyle,
  oilProfileThumbStyle,
} from '@/lib/oljeprofiler-ui'

type Profile = {
  id: number
  name: string
  length_ft: number | null
  ratio: number | null
  category: string
  season: string | null
  description: string | null
  pdf_url: string | null
  kosi_url: string | null
}

const CATEGORIES: { key: string; label: string; color: string; bg: string }[] = [
  { key: 'elite',        label: 'Elitserien',   color: '#f5c200', bg: 'rgba(245,194,0,0.10)' },
  { key: 'elite_damer',  label: 'Elit Damer',   color: '#d94a90', bg: 'rgba(217,74,144,0.10)' },
  { key: 'bredare',      label: 'Bredare',       color: '#5a82b4', bg: 'rgba(91,130,180,0.10)' },
  { key: 'sammandrag',   label: 'Sammandrag',    color: '#4a90d9', bg: 'rgba(74,144,217,0.10)' },
  { key: 'kval',         label: 'Kval',          color: '#e09030', bg: 'rgba(224,144,48,0.10)' },
  { key: 'sm',           label: 'SM',            color: '#c07fff', bg: 'rgba(192,127,255,0.10)' },
]

function OljeprofilerarPageInner() {
  const searchParams = useSearchParams()
  const highlight = searchParams.get('q')?.toLowerCase() ?? null
  const highlightRef = useRef<HTMLDivElement | null>(null)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    createClient()
      .from('oil_profiles')
      .select('*')
      .order('category')
      .order('length_ft')
      .then(({ data }) => {
        setProfiles((data as Profile[]) ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!highlight || loading) return
    setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }, [highlight, loading])

  const filtered = activeCategory
    ? profiles.filter(p => p.category === activeCategory)
    : profiles

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    profiles: filtered.filter(p => p.category === cat.key),
  })).filter(g => g.profiles.length > 0)

  return (
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg">
      <div className="px-5 pt-5 pb-3">
        <p className="m-0 text-[13px] text-dark-muted">
          {loading ? 'Laddar...' : `${profiles.length} profiler · säsong 2025/2026`}
        </p>
      </div>

      <div
        className={cn(
          'flex gap-2 overflow-x-auto px-4 py-2',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        <FilterChip active={activeCategory === null} onClick={() => setActiveCategory(null)}>
          Alla
        </FilterChip>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(isActive ? null : cat.key)}
              className={cn(
                'shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold',
                !isActive && 'border-light-border bg-light-card text-dark-muted dark:border-dark-border dark:bg-dark-card',
              )}
              style={
                isActive
                  ? { borderColor: `${cat.color}88`, background: cat.bg, color: cat.color }
                  : undefined
              }
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-5 px-4">
        {loading
          ? [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-[120px] animate-pulse rounded-2xl border border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card"
              />
            ))
          : grouped.map(group => (
              <section key={group.key}>
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={oilCategoryDotStyle(group.color)}
                  />
                  <span
                    className="text-[11px] font-extrabold tracking-wide"
                    style={oilCategoryLabelStyle(group.color)}
                  >
                    {group.label.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {group.profiles.map(p => {
                    const isHighlighted =
                      !!highlight && p.name.toLowerCase().includes(highlight)

                    return (
                      <div
                        key={p.id}
                        ref={isHighlighted ? highlightRef : null}
                        className={cn(
                          'flex items-center gap-3 rounded-[14px] border p-3',
                          'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
                          isHighlighted &&
                            'border-gold/55 bg-gold/[0.07] shadow-[0_0_0_3px_rgba(245,194,0,0.10)]',
                        )}
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border"
                          style={oilProfileThumbStyle(group)}
                        >
                          <span
                            className="text-[15px] leading-none font-black"
                            style={oilProfileAccentStyle(group.color)}
                          >
                            {p.length_ft}
                          </span>
                          <span
                            className="text-[9px] font-semibold opacity-70"
                            style={oilProfileAccentStyle(group.color)}
                          >
                            fot
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm leading-tight font-bold bk-text-primary">{p.name}</div>
                          {p.ratio != null && (
                            <div className="mt-0.5 text-xs text-dark-muted">
                              Ratio {String(p.ratio).replace('.', ',')}
                            </div>
                          )}
                          {p.description && (
                            <div className="mt-0.5 text-[11px] text-dark-muted">{p.description}</div>
                          )}
                        </div>

                        {p.pdf_url && (
                          <a
                            href={p.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'flex shrink-0 flex-col items-center gap-0.5 rounded-[10px] border px-2 py-1.5 no-underline',
                              'border-gold/20 bg-gold/[0.08]',
                            )}
                          >
                            <FileText size={14} className="text-gold" />
                            <span className="text-[9px] font-bold text-gold">PDF</span>
                          </a>
                        )}
                        {p.kosi_url && (
                          <a
                            href={p.kosi_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'flex shrink-0 flex-col items-center gap-0.5 rounded-[10px] border px-2 py-1.5 no-underline',
                              'border-light-border bg-black/5 dark:bg-white/6',
                            )}
                          >
                            <ExternalLink size={14} className="text-dark-muted" />
                            <span className="text-[9px] font-bold text-dark-muted">KOSI</span>
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}

        {!loading && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-dark-muted">Inga profiler hittades</p>
        )}
      </div>
    </div>
  )
}

export default function OljeprofilerarPage() {
  return (
    <Suspense>
      <OljeprofilerarPageInner />
    </Suspense>
  )
}
