import { greetingFor, homeNote } from '@/lib/home-tip';

describe('greetingFor', () => {
  it('picks the part of day', () => {
    expect(greetingFor(8, null)).toBe('God morgon');
    expect(greetingFor(13, null)).toBe('God dag');
    expect(greetingFor(20, null)).toBe('God kväll');
  });
  it('adds the first name when claimed', () => {
    expect(greetingFor(20, 'Tobias')).toBe('God kväll, Tobias');
  });
});

describe('homeNote', () => {
  const base = { daysToMatch: null, opponent: null, matchId: null as number | null, daySeed: 0 };

  it('is a match-day nudge on the day', () => {
    const n = homeNote({ ...base, daysToMatch: 0, opponent: 'BK Pilen', matchId: 42 });
    expect(n.text).toContain('Matchdag');
    expect(n.text).toContain('BK Pilen');
    expect(n.matchId).toBe(42);
  });

  it('says tomorrow at 1 day', () => {
    expect(homeNote({ ...base, daysToMatch: 1, matchId: 42 }).text).toContain('imorgon');
  });

  it('counts down within 5 days', () => {
    expect(homeNote({ ...base, daysToMatch: 3, matchId: 42 }).text).toContain('om 3 dagar');
  });

  it('falls back to a rotating tip far from a match (no matchId link)', () => {
    const n = homeNote({ ...base, daysToMatch: 12, opponent: 'X', matchId: 42, daySeed: 1 });
    expect(n.matchId).toBeNull();
    expect(n.text.length).toBeGreaterThan(0);
  });

  it('rotates deterministically by day seed', () => {
    const a = homeNote({ ...base, daySeed: 1 }).text;
    const b = homeNote({ ...base, daySeed: 2 }).text;
    const a2 = homeNote({ ...base, daySeed: 1 }).text;
    expect(a).toBe(a2);
    expect(a).not.toBe(b);
  });
});
