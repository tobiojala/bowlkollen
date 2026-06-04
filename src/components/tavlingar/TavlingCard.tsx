'use client'

import { Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { TAVLING_SPRING, type Tavling } from '@/lib/tavlingar-data'

const GOLD = '#f5c200'

type Props = {
  t: Tavling
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}

export function TavlingCard({ t, isFavorite, onToggleFavorite }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const isPagaende = t.status === 'pagaende'
  const isDone = t.status === 'avslutad'
  const hasBanner = !!t.banner

  const statusLabel = isPagaende ? 'PÅGÅENDE' : isDone ? 'AVSLUTAD' : 'KOMMANDE'
  const statusColor = isPagaende ? 'text-gold' : isDone ? 'text-dark-muted' : 'text-gold'

  const accentBar = isPagaende
    ? `linear-gradient(90deg,${GOLD},rgba(245,194,0,0.15))`
    : isDone
      ? `linear-gradient(90deg,${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'},transparent)`
      : 'linear-gradient(90deg,#f5c200,rgba(245,194,0,0.15))'

  const cardBg = isPagaende
    ? dark
      ? 'rgba(245,194,0,0.07)'
      : 'rgba(245,194,0,0.04)'
    : isDone
      ? 'transparent'
      : dark
        ? 'rgba(245,194,0,0.05)'
        : 'rgba(245,194,0,0.03)'

  const cardBorder = isPagaende
    ? 'rgba(245,194,0,0.25)'
    : isDone
      ? dark
        ? 'rgba(255,255,255,0.07)'
        : 'rgba(0,0,0,0.07)'
      : dark
        ? 'rgba(245,194,0,0.15)'
        : 'rgba(245,194,0,0.2)'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDone ? 0.6 : 1, y: 0 }}
      transition={TAVLING_SPRING}
      className="mx-3 my-1.5 overflow-hidden rounded-2xl"
      style={{
        background: hasBanner ? 'transparent' : cardBg,
        border: `1px solid ${cardBorder}`,
      }}
    >
      {hasBanner ? (
        <div className="relative h-[136px] overflow-hidden">
          <img
            src={t.banner}
            alt={t.name}
            className="block h-full w-full object-cover object-[center_30%]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.75) 100%)',
            }}
          />
          <div className="absolute top-2.5 left-3 inline-flex items-center gap-1 rounded-[20px] border border-gold/40 bg-gold/20 px-2.5 py-0.5">
            <span className="text-[9px] text-gold">◆</span>
            <span className="text-[9px] font-extrabold tracking-wide text-gold">
              {statusLabel}
            </span>
          </div>
          <FavoriteButton
            isFavorite={isFavorite}
            onClick={() => onToggleFavorite(t.id)}
            onBanner
          />
          <div className="absolute right-0 bottom-0 left-0 px-3.5 py-2.5">
            <div className="text-[15px] leading-snug font-bold text-white">{t.name}</div>
            <div className="mt-0.5 text-[10px] text-white/70">
              {t.date} · {t.venue}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-0.5" style={{ background: accentBar }} />
      )}

      <div
        className="px-3.5 py-3"
        style={{ background: hasBanner ? cardBg : undefined }}
      >
        {!hasBanner && (
          <div className="mb-2 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5">
                {isPagaende && (
                  <div
                    className="size-1.5 shrink-0 rounded-full bg-gold"
                    style={{ boxShadow: `0 0 5px ${GOLD}` }}
                  />
                )}
                <span className={cn('text-[9px] font-extrabold tracking-wide', statusColor)}>
                  {statusLabel}
                </span>
              </div>
              <div className="mb-1 text-[15px] leading-snug font-bold text-light-text dark:text-dark-text">
                {t.name}
              </div>
              <p className="mb-1.5 text-[11px] leading-snug text-dark-muted">{t.subtitle}</p>
              <p className="text-[10px] text-dark-muted">
                {t.date} · {t.venue}
              </p>
            </div>
            <FavoriteButton
              isFavorite={isFavorite}
              onClick={() => onToggleFavorite(t.id)}
            />
          </div>
        )}

        {hasBanner && (
          <p className="mb-2.5 text-[11px] leading-snug text-dark-muted">{t.subtitle}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <a
            href={t.href}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-[11px] font-bold no-underline',
              isDone
                ? 'border border-light-border text-dark-muted dark:border-dark-border'
                : 'bg-gold text-[#1a1400]',
            )}
          >
            {t.buttonLabel}
          </a>
          {t.officialHref && t.officialHref !== t.href && (
            <a
              href={t.officialHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-light-border px-3.5 py-1.5 text-[11px] font-bold text-dark-muted no-underline dark:border-dark-border"
            >
              Officiell sida ↗
            </a>
          )}
          {t.extraButtons?.map(b => (
            <a
              key={b.label}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-light-border px-3.5 py-1.5 text-[11px] font-bold text-dark-muted no-underline dark:border-dark-border"
            >
              {b.label} ↗
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function FavoriteButton({
  isFavorite,
  onClick,
  onBanner,
}: {
  isFavorite: boolean
  onClick: () => void
  onBanner?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 cursor-pointer border-none bg-transparent p-1 [-webkit-tap-highlight-color:transparent]',
        onBanner && 'absolute top-1.5 right-2.5',
      )}
    >
      <Star
        size={18}
        strokeWidth={1.8}
        fill={isFavorite ? '#f5c200' : 'none'}
        className={
          isFavorite ? 'text-gold' : onBanner ? 'text-white/70' : 'text-dark-muted'
        }
      />
    </button>
  )
}
