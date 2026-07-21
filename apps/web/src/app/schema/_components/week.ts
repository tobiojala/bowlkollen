import { getISOWeek } from 'date-fns'
import { hexToHsl, hslToHex } from '@/lib/color'

/** Monday (ISO) of the week containing dateStr, as YYYY-MM-DD — the shared weekKey used by SeasonWeekline, SeasonHeatmap and page.tsx's grouping. */
export function isoWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() // 0 = Sunday .. 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

/** Default gold-intensity scale — every Atlas heatmap surface falls back to this
 * when there's no division-specific accent (Sverige, "Din säsong", lower tiers). */
export const HEATMAP_COLORS = [
  '#1c2127',
  '#31373e',
  '#4b525a',
  '#927500',
  '#f5c200',
] as const

/** Builds the 5-step intensity ramp. Low activity stays a neutral, cool ink
 * tone (not a faint tint of the accent) — gold/the division's own color only
 * shows up once activity is genuinely high. That keeps gold "earned" instead
 * of diluted onto every non-zero day, and the busiest cell on every slide is
 * always gold — the universal "this is the special one" signal stays
 * consistent everywhere, regardless of which division's slide you're on. */
export function buildHeatmapPalette(accent?: string): readonly string[] {
  const identity = accent && accent.startsWith('#') ? accent : '#f5c200'
  return ['#1c2127', '#31373e', '#4b525a', identity, '#f5c200'] as const
}

/** Identity-led ramp for the Atlas map view, where 48 grids sit side by side
 * and color alone has to identify which division is which. buildHeatmapPalette
 * deliberately routes most weeks through neutral gray so gold stays reserved
 * for one division's genuine peak — right for a single full-size grid, but it
 * makes every map-view thumbnail look the same shade of gray. This ramp shows
 * the division's own hue on every active cell instead, brighter for busier
 * weeks, so the grid's overall color reads as that division's identity. */
export function buildIdentityPalette(hex: string): readonly string[] {
  const [h, s, l] = hexToHsl(hex)
  return [
    '#1c2127',
    hslToHex(h, Math.max(20, s * 0.55), Math.max(16, l - 22)),
    hslToHex(h, Math.max(30, s * 0.75), Math.max(22, l - 10)),
    hslToHex(h, s, l),
    hslToHex(h, Math.min(100, s + 12), Math.min(86, l + 16)),
  ] as const
}

export function heatmapLevel(count: number, maxCount: number, isFuture: boolean, steps = 5): number {
  if (isFuture || count === 0) return 0
  return Math.min(Math.ceil((count / maxCount) * (steps - 1)), steps - 1)
}

export function heatmapColor(count: number, maxCount: number, isFuture: boolean, palette: readonly string[] = HEATMAP_COLORS): string {
  return palette[heatmapLevel(count, maxCount, isFuture, palette.length)]
}

/** The week with the most matches in a date list — the stat that anchors the
 * grid (HabitKit never lets the pattern stand alone without a number). */
export function busiestWeek(dates: string[]): { weekStart: string; isoWeek: number; count: number } | null {
  const counts = new Map<string, number>()
  for (const d of dates) {
    const wk = isoWeekStart(d.slice(0, 10))
    counts.set(wk, (counts.get(wk) ?? 0) + 1)
  }
  let best: { weekStart: string; count: number } | null = null
  for (const [weekStart, count] of counts) {
    if (!best || count > best.count) best = { weekStart, count }
  }
  if (!best) return null
  return { weekStart: best.weekStart, count: best.count, isoWeek: getISOWeek(new Date(best.weekStart + 'T12:00:00')) }
}
