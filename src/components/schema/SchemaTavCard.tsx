'use client'

import { cn } from '@/lib/cn'

export type SchemaTavling = {
  id: string
  name: string
  subtitle: string
  dateFrom: string | null
  dateTo: string | null
  dateLabel: string
  venue: string
  status: 'pagaende' | 'kommande' | 'avslutad'
  href: string
  buttonLabel: string
  officialHref?: string
  extraButtons?: { label: string; href: string }[]
}

type Props = {
  t: SchemaTavling
  activeDate: string | null
}

export function SchemaTavCard({ t, activeDate }: Props) {
  const isLive = t.status === 'pagaende'
  const statusColor = isLive ? 'text-gold' : t.status === 'kommande' ? 'text-gold' : 'text-dark-muted'

  let dayInfo: string | null = null
  if (t.dateFrom && t.dateTo && activeDate) {
    const totalDays =
      Math.round(
        (new Date(t.dateTo + 'T12:00:00').getTime() - new Date(t.dateFrom + 'T12:00:00').getTime()) /
          86400000,
      ) + 1
    if (totalDays > 1) {
      const dayNum =
        Math.round(
          (new Date(activeDate + 'T12:00:00').getTime() -
            new Date(t.dateFrom + 'T12:00:00').getTime()) /
            86400000,
        ) + 1
      dayInfo = `Dag ${dayNum} av ${totalDays}`
    }
  }

  return (
    <div
      className={cn(
        'mx-2 mt-2 mb-1 overflow-hidden rounded-[14px] border',
        isLive
          ? 'border-gold/25 bg-gold/7 dark:bg-gold/6'
          : 'border-gold/20 bg-gold/3 dark:border-gold/15 dark:bg-gold/5',
      )}
    >
      <div
        className={cn(
          'h-0.5',
          isLive
            ? 'bg-gradient-to-r from-gold to-gold/20'
            : 'bg-gradient-to-r from-gold to-gold/15',
        )}
      />
      <div className="px-3.5 py-3">
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex items-center gap-1.25">
            {isLive && (
              <div className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_5px_#f5c200]" />
            )}
            <span className={cn('text-[9px] font-extrabold tracking-wide', statusColor)}>
              {isLive ? 'PÅGÅENDE' : t.status === 'kommande' ? 'KOMMANDE' : 'AVSLUTAD'}
            </span>
          </div>
          {dayInfo && (
            <span className="ml-auto rounded bg-black/6 px-1.75 py-0.5 text-[9px] font-bold text-dark-muted dark:bg-white/7">
              {dayInfo}
            </span>
          )}
        </div>
        <div className="mb-0.5 text-sm font-bold bk-text-primary">{t.name}</div>
        <div className="mb-1.5 text-[11px] text-dark-muted">{t.subtitle}</div>
        <div className="mb-3 text-[10px] text-dark-muted">
          {t.dateLabel} · {t.venue}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={t.href}
            className="rounded-lg bg-gold px-3.5 py-1.5 text-[11px] font-bold text-[#1a1400] no-underline"
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
    </div>
  )
}
