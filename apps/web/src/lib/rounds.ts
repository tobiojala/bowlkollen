// Group a division's matches into rounds (omgångar) — the natural unit of a
// Swedish bowling season. Round ids from BITS can be sparse/odd in preliminary
// data, so groups are re-labelled sequentially by date (always Omgång 1, 2, 3…).

export type RoundLike = {
  match_date: string
  round_id:   number | null
  is_finished: boolean | null
}

export type RoundGroup<T> = {
  key:       string
  label:     string   // "Omgång 3"
  firstDate: string   // 'YYYY-MM-DD'
  lastDate:  string
  played:    boolean  // every match in the round finished
  matches:   T[]      // sorted by date
}

const MONTH_SE = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export function groupByRound<T extends RoundLike>(input: T[]): RoundGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const m of input) {
    const key = m.round_id != null ? `r${m.round_id}` : `d${m.match_date.slice(0, 10)}`
    const bucket = map.get(key)
    if (bucket) bucket.push(m); else map.set(key, [m])
  }

  const groups = [...map.entries()].map(([key, matches]) => {
    const dates = matches.map(x => x.match_date.slice(0, 10)).sort()
    return {
      key,
      firstDate: dates[0],
      lastDate:  dates[dates.length - 1],
      played:    matches.every(x => x.is_finished === true),
      matches:   [...matches].sort((a, b) => a.match_date.localeCompare(b.match_date)),
    }
  })

  groups.sort((a, b) => a.firstDate.localeCompare(b.firstDate))
  return groups.map((g, i) => ({ ...g, label: `Omgång ${i + 1}` }))
}

/** "12 sep" · "12–14 sep" · "28 sep – 2 okt" */
export function roundDateLabel(firstDate: string, lastDate: string): string {
  const f = new Date(firstDate + 'T12:00:00')
  const l = new Date(lastDate + 'T12:00:00')
  const fd = f.getDate(), ld = l.getDate()
  const fm = MONTH_SE[f.getMonth()], lm = MONTH_SE[l.getMonth()]
  if (firstDate === lastDate) return `${fd} ${fm}`
  if (fm === lm)              return `${fd}–${ld} ${fm}`
  return `${fd} ${fm} – ${ld} ${lm}`
}
