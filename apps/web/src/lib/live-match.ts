// A league match is "live" from shortly before its scheduled kickoff until a
// generous window after — long enough to cover a full 4-serie match plus warmup,
// short enough that a stale not-finished row doesn't read as live forever.
// match_datetime is naive Swedish local wall-clock; for our (Swedish) users the
// browser's local time is the same zone, so a plain Date parse compares correctly.
const LIVE_LEAD_MIN = 15
const LIVE_WINDOW_H = 5

export function isMatchLive(m: { is_finished: boolean; match_datetime: string | null }): boolean {
  if (m.is_finished || !m.match_datetime) return false
  const start = new Date(m.match_datetime.replace(' ', 'T')).getTime()
  if (Number.isNaN(start)) return false
  const now = Date.now()
  return now >= start - LIVE_LEAD_MIN * 60_000 && now <= start + LIVE_WINDOW_H * 3_600_000
}
