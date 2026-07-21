import { describe, it, expect } from 'vitest'
import { icsDate, icsDateOnly, icsEscape, buildIcs, type CalEvent } from '@/lib/calendar'

describe('icsDate', () => {
  it('formats a UTC timestamp with Z suffix', () => {
    expect(icsDate(new Date('2026-02-14T13:05:09Z'))).toBe('20260214T130509Z')
  })
})

describe('icsDateOnly', () => {
  it('formats an all-day date value', () => {
    expect(icsDateOnly(new Date('2026-02-14T00:00:00Z'))).toBe('20260214')
  })
})

describe('icsEscape', () => {
  it('escapes commas, semicolons, backslashes and newlines', () => {
    expect(icsEscape('A, B; C\\D\nE')).toBe('A\\, B\\; C\\\\D\\nE')
  })
})

describe('buildIcs', () => {
  const base: CalEvent = {
    uid: 'x@bowlkollen',
    start: new Date('2026-02-14T00:00:00Z'),
    allDay: true,
    summary: 'BK Scheele – Köpings PBK',
  }

  it('wraps events in a VCALENDAR with CRLF line endings', () => {
    const ics = buildIcs('Div 3', [base])
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).toContain('\r\n')
  })

  it('emits all-day events as VALUE=DATE with an exclusive next-day end', () => {
    const ics = buildIcs('Div 3', [base])
    expect(ics).toContain('DTSTART;VALUE=DATE:20260214')
    expect(ics).toContain('DTEND;VALUE=DATE:20260215')
    expect(ics).not.toContain('DTSTART:20260214T')
  })

  it('emits timed events with a default 3h duration', () => {
    const ics = buildIcs('Div 3', [{ ...base, allDay: false, start: new Date('2026-02-14T13:00:00Z') }])
    expect(ics).toContain('DTSTART:20260214T130000Z')
    expect(ics).toContain('DTEND:20260214T160000Z')
  })

  it('includes optional location and description', () => {
    const ics = buildIcs('Div 3', [{ ...base, location: 'Köpings BC', description: 'Omgång 2' }])
    expect(ics).toContain('LOCATION:Köpings BC')
    expect(ics).toContain('DESCRIPTION:Omgång 2')
  })
})
