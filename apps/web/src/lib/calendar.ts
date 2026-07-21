// iCalendar (.ics) generation — RFC 5545. Pure string building so it works
// identically in a route handler (live subscribable feed) and a download.

export type CalEvent = {
  uid:          string
  start:        Date
  end?:         Date          // timed: defaults to start + 3h; all-day: ignored
  allDay?:      boolean       // Swedish league fixtures are date-only → all-day
  summary:      string
  location?:    string
  description?: string
}

const MATCH_DURATION_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** RFC 5545 UTC timestamp: 20260214T130000Z */
export function icsDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    d.getUTCFullYear().toString() +
    p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + 'T' +
    p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + 'Z'
  )
}

/** RFC 5545 all-day date value: 20260214 */
export function icsDateOnly(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return d.getUTCFullYear().toString() + p(d.getUTCMonth() + 1) + p(d.getUTCDate())
}

/** Escape TEXT values per RFC 5545 (backslash, comma, semicolon, newline). */
export function icsEscape(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

export function buildIcs(calName: string, events: CalEvent[]): string {
  const now = icsDate(new Date())
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bowlkollen//Schema//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(calName)}`,
    'X-WR-TIMEZONE:Europe/Stockholm',
  ]
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${now}`)
    if (e.allDay) {
      // DTEND for an all-day event is exclusive → the next day.
      const end = new Date(e.start.getTime() + DAY_MS)
      lines.push(`DTSTART;VALUE=DATE:${icsDateOnly(e.start)}`, `DTEND;VALUE=DATE:${icsDateOnly(end)}`)
    } else {
      const end = e.end ?? new Date(e.start.getTime() + MATCH_DURATION_MS)
      lines.push(`DTSTART:${icsDate(e.start)}`, `DTEND:${icsDate(end)}`)
    }
    lines.push(`SUMMARY:${icsEscape(e.summary)}`)
    if (e.location)    lines.push(`LOCATION:${icsEscape(e.location)}`)
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  // RFC 5545 requires CRLF line endings.
  return lines.join('\r\n') + '\r\n'
}
