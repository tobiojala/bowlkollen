import { momentShareText, momentHeadline, type Moment } from '@/lib/share';

describe('momentShareText', () => {
  it('rivalry names the leader', () => {
    const m: Moment = { kind: 'rivalry', aName: 'Anna A', bName: 'Erik B', aWins: 6, bWins: 4, meetings: 10 };
    const t = momentShareText(m);
    expect(t).toContain('Anna A mot Erik B');
    expect(t).toContain('6–4');
    expect(t).toContain('10 möten');
    expect(t).toContain('Anna A leder');
  });

  it('rivalry reads as even when tied', () => {
    const m: Moment = { kind: 'rivalry', aName: 'A', bName: 'B', aWins: 5, bWins: 5, meetings: 10 };
    expect(momentShareText(m)).toContain('Helt jämnt');
  });

  it('record includes win rate and optional highlight', () => {
    const m: Moment = { kind: 'record', name: 'Me', wins: 223, losses: 170, winRate: 0.567, played: 394, highlight: '1× 300 vid bordet' };
    const t = momentShareText(m);
    expect(t).toContain('Mitt bordfacit');
    expect(t).toContain('223–170');
    expect(t).toContain('57% vinst');
    expect(t).toContain('394 bord');
    expect(t).toContain('1× 300 vid bordet');
  });

  it('milestone formats title/value/sub', () => {
    const m: Moment = { kind: 'milestone', who: 'W. Svensson', title: 'Perfekt spel', value: '300', sub: 'i en delmatch' };
    const t = momentShareText(m);
    expect(t).toContain('Perfekt spel: 300');
    expect(t).toContain('i en delmatch');
    expect(t).toContain('W. Svensson');
  });

  it('headline is uppercase and kind-appropriate', () => {
    expect(momentHeadline({ kind: 'rivalry', aName: 'A', bName: 'B', aWins: 1, bWins: 0, meetings: 1 })).toBe('HETASTE BORDET');
    expect(momentHeadline({ kind: 'record', name: 'x', wins: 1, losses: 0, winRate: 1, played: 1 })).toBe('BORDFACIT');
  });
});
