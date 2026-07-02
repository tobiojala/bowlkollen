// Week helpers (ISO, Monday-based) — the season atlas and the schema feed both think in weeks

export function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function isoWeek(dateStr: string): number {
  const d = new Date(Date.UTC(+dateStr.slice(0, 4), +dateStr.slice(5, 7) - 1, +dateStr.slice(8, 10)))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

// "13–19 jan" or "28 apr–4 maj" for the Mon–Sun span starting at `monday`
export function weekRangeLabel(monday: string): string {
  const a = new Date(monday + 'T12:00:00')
  const b = new Date(addDays(monday, 6) + 'T12:00:00')
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS[a.getMonth()]}`
  return `${a.getDate()} ${MONTHS[a.getMonth()]}–${b.getDate()} ${MONTHS[b.getMonth()]}`
}
