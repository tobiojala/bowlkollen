import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

const DIVISION_TIERS: Record<string, number> = {
  'Elitserien Herrar': 1,
  'Elitserien Damer': 1,
  'SM-slutspel Herrar': 1,
  'SM-slutspel Damer': 1,
  'Mellanallsvenskan Herrar': 2,
  'Nordallsvenskan Herrar': 2,
  'Sydallsvenskan Herrar': 2,
  'Norra Allsvenskan Herrar': 2,
  'Södra Allsvenskan Herrar': 2,
}

export function schemaDivisionTier(d: string): number {
  return DIVISION_TIERS[d] || 3
}

export function schemaDivColor(d: string): string {
  if (d.includes('SM')) return 'hsl(44, 50%, 52%)'
  if (d.includes('Elitserien') && d.includes('Damer')) return 'hsl(320, 30%, 58%)'
  if (d.includes('Elitserien')) return 'hsl(210, 35%, 55%)'
  if (schemaDivisionTier(d) === 2) return 'hsl(130, 22%, 50%)'
  return 'hsl(35, 12%, 52%)'
}

export function schemaDivColorAlpha(d: string, alpha: number): string {
  return schemaDivColor(d).replace('hsl(', 'hsla(').replace(')', `, ${alpha})`)
}

export function schemaTierHeaderStyle(div: string, isDark: boolean): CSSProperties {
  const dc = schemaDivColor(div)
  return {
    borderLeft: `4px solid ${dc}`,
    background: `linear-gradient(90deg, ${schemaDivColorAlpha(div, isDark ? 0.14 : 0.08)} 0%, transparent 75%)`,
  }
}

export function schemaDivDotStyle(color: string): CSSProperties {
  return { background: color }
}

export function schemaDivLabelStyle(color: string): CSSProperties {
  return { color }
}

export function schemaMatchRowBg(bg: string | undefined): CSSProperties | undefined {
  return bg ? { background: bg } : undefined
}

export function schemaMatchBarStyle(color: string): CSSProperties {
  return { background: color }
}

export const schemaPillClass = (active: boolean) =>
  cn(
    'shrink-0 cursor-pointer rounded-full border px-3 py-1 text-[11px] font-bold whitespace-nowrap',
    '[-webkit-tap-highlight-color:transparent]',
    active
      ? 'border-gold bg-gold text-[#1a1400]'
      : 'border-light-border bg-transparent text-dark-muted dark:border-dark-border',
  )

export const schemaGhostPillClass = cn(
  'shrink-0 cursor-pointer rounded-full border border-light-border bg-transparent px-2.5 py-1',
  'text-[11px] font-bold whitespace-nowrap text-dark-muted',
  '[-webkit-tap-highlight-color:transparent] dark:border-dark-border',
)

export const schemaDivider = 'h-4 w-px shrink-0 bg-light-border dark:bg-dark-border'

export const schemaSectionRule = 'flex flex-1 items-center gap-2.5 px-4 pt-3 pb-1'
