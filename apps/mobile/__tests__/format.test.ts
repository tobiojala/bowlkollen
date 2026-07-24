import { formatMatchDate, relativeMatchDate } from '@/lib/format';

describe('formatMatchDate', () => {
  it('formats an ISO date as day + Swedish short month', () => {
    expect(formatMatchDate('2026-07-22')).toBe('22 jul');
    expect(formatMatchDate('2026-01-03')).toBe('3 jan');
    expect(formatMatchDate('2026-12-31')).toBe('31 dec');
  });

  it('returns the input unchanged when it is not a parseable date', () => {
    expect(formatMatchDate('nope')).toBe('nope');
  });
});

describe('relativeMatchDate', () => {
  const now = new Date(2026, 6, 20); // Mon 20 Jul 2026 (local)

  it('says Idag / Imorgon for today and tomorrow', () => {
    expect(relativeMatchDate('2026-07-20', now)).toBe('Idag');
    expect(relativeMatchDate('2026-07-21', now)).toBe('Imorgon');
  });

  it('names the weekday for dates later this week', () => {
    expect(relativeMatchDate('2026-07-23', now)).toBe('Torsdag'); // +3 days
  });

  it('falls back to an absolute date a week or more out', () => {
    expect(relativeMatchDate('2026-07-27', now)).toBe('27 jul'); // +7 days
    expect(relativeMatchDate('2026-08-15', now)).toBe('15 aug');
  });
});
