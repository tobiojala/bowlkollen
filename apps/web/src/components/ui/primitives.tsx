'use client'

/**
 * Core design-system primitives — dark-first, mobile-first.
 *
 * Rules these encode:
 *  - Elevation is tonal (bg → surface → surface-2), never a border.
 *  - One hero number per screen. Gold is a budget, not a default.
 *  - Nothing below 11px. Scores are tabular.
 *  - Every tap target ≥ 44px.
 */

import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'

/* ── Surface ─────────────────────────────────────────────────────────────
   The only card. Tonal, borderless, 16px radius. */
export function Surface({ level = 1, className, onClick, children }: {
  level?: 1 | 2
  className?: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl',
        level === 1 ? 'bg-surface' : 'bg-surface-2',
        onClick && 'cursor-pointer active:scale-[0.985] transition-transform duration-100',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ── SectionHeader ───────────────────────────────────────────────────────
   The one permitted caps micro-label (11px). */
export function SectionHeader({ label, right, className }: {
  label: string
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <span className="text-label font-bold uppercase text-ink-3">{label}</span>
      {right}
    </div>
  )
}

/* ── HeroNumber ──────────────────────────────────────────────────────────
   The Revolut pattern: one giant number per screen, with a delta + caption. */
export function HeroNumber({ label, value, unit, delta, deltaSuffix, caption, className }: {
  label?: string
  value: string | number
  unit?: string
  delta?: number
  deltaSuffix?: string
  caption?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {label && <div className="text-label font-bold uppercase text-ink-3 mb-2">{label}</div>}
      <div className="flex items-baseline gap-3">
        <span className="text-hero font-black text-ink tabular-nums">{value}</span>
        {unit && <span className="text-body text-ink-3 font-medium">{unit}</span>}
        {delta !== undefined && delta !== 0 && (
          <span className={cn(
            'text-caption font-bold tabular-nums rounded-full px-2.5 py-1',
            delta > 0 ? 'text-green bg-green/10' : 'text-red bg-red/10',
          )}>
            {delta > 0 ? '+' : ''}{delta}{deltaSuffix ?? ''}
          </span>
        )}
      </div>
      {caption && <div className="text-caption text-ink-2 mt-2">{caption}</div>}
    </div>
  )
}

/* ── ActionRow / ActionButton ────────────────────────────────────────────
   The Phantom pattern: a row of round actions under the hero. */
export function ActionRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-start justify-around', className)}>{children}</div>
}

export function ActionButton({ icon: Icon, label, onClick, active }: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 min-w-[64px] py-1 cursor-pointer bg-transparent border-none
                 active:scale-95 transition-transform duration-100"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span className={cn(
        'flex items-center justify-center w-[52px] h-[52px] rounded-full transition-colors duration-150',
        active ? 'bg-gold/15 text-gold' : 'bg-surface-2 text-ink',
      )}>
        <Icon size={21} strokeWidth={2} />
      </span>
      <span className={cn('text-label font-semibold normal-case tracking-normal', active ? 'text-gold' : 'text-ink-2')}>
        {label}
      </span>
    </button>
  )
}

/* ── Pill ────────────────────────────────────────────────────────────────
   Filter/segment pill. Visual is compact; hit area is 44px. */
export function Pill({ label, active, onClick }: {
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="min-h-[44px] px-1 bg-transparent border-none cursor-pointer flex items-center"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span className={cn(
        'px-3.5 py-2 rounded-full text-caption font-semibold transition-colors duration-150',
        active ? 'bg-ink text-bg' : 'bg-surface-2 text-ink-3',
      )}>
        {label}
      </span>
    </button>
  )
}

/* ── StatTile ────────────────────────────────────────────────────────────
   One stat in a grid. Number first, label after — never the reverse. */
export function StatTile({ value, label, tone = 'neutral' }: {
  value: string | number
  label: string
  tone?: 'neutral' | 'positive' | 'negative' | 'gold'
}) {
  const toneCls =
    tone === 'positive' ? 'text-green' :
    tone === 'negative' ? 'text-red' :
    tone === 'gold'     ? 'text-gold' : 'text-ink'
  return (
    <div className="text-center">
      <div className={cn('text-[22px] leading-none font-black tabular-nums', toneCls)}>{value}</div>
      <div className="text-label text-ink-3 mt-1.5 normal-case tracking-normal font-medium">{label}</div>
    </div>
  )
}

/* ── Hairline ────────────────────────────────────────────────────────────
   The only allowed divider. */
export function Hairline({ className }: { className?: string }) {
  return <div className={cn('h-px bg-hairline', className)} />
}
