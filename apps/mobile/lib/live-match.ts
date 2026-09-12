// A league match is "live" from shortly before kickoff until a generous window
// after — matches web's isMatchLive. match_datetime is naive Swedish local; for
// Swedish users the device's local time is the same zone, so a plain parse works.
const LIVE_LEAD_MIN = 15;
const LIVE_WINDOW_H = 5;

export function isMatchLive(m: { is_finished: boolean | null; match_datetime: string | null }): boolean {
  if (m.is_finished || !m.match_datetime) return false;
  const start = new Date(m.match_datetime.replace(' ', 'T')).getTime();
  if (Number.isNaN(start)) return false;
  const now = Date.now();
  return now >= start - LIVE_LEAD_MIN * 60_000 && now <= start + LIVE_WINDOW_H * 3_600_000;
}
