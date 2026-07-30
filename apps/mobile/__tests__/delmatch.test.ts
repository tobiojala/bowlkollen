import {
  computeDelmatcher,
  computePlayerDelmatchRecord,
  playerDelmatcher,
  type DelmatchRow,
  type DelmatchSlot,
} from '@/lib/delmatch';

// Build slots concisely: [tableNo, order, isHome, name, score]
function slots(serie: number, rows: [number, number, boolean, string, number][]): DelmatchSlot[] {
  return rows.map(([tableNo, order, isHomeTeam, playerName, score]) => ({
    serie, tableNo, order, isHomeTeam, playerName, publicId: playerName, score,
  }));
}

// Real serie 1 of match 3290305 (women's Elitserien, 8M8BA → 2v2).
// T1 355 vs 356 (away), T2 448 vs 477 (away), T3 400 vs 345 (home), T4 389 vs 322 (home).
// Serie pinfall home 1592 vs away 1500 → home takes the pinfall point.
const SERIE1 = slots(1, [
  [1, 1, true, 'Molander', 161], [1, 2, true, 'H.Engberg', 194],
  [1, 1, false, 'Layrisse', 176], [1, 2, false, 'Neidenmark', 180],
  [2, 1, true, 'M.Engberg', 231], [2, 2, true, 'V.Johansson', 217],
  [2, 1, false, 'Juntunen', 266], [2, 2, false, 'Konsteri', 211],
  [3, 1, true, 'Bergqvist', 233], [3, 2, true, 'Blomqvist', 167],
  [3, 1, false, 'Berg', 196], [3, 2, false, 'Lindius', 149],
  [4, 1, true, 'Hermansson', 196], [4, 2, true, 'Gunnarsson', 193],
  [4, 1, false, 'Asklund', 138], [4, 2, false, 'Brodin', 184],
]);

describe('computeDelmatcher — 2v2 (8-man)', () => {
  const s = computeDelmatcher(SERIE1);

  it('detects the konstellation size and one serie of four tables', () => {
    expect(s.konstellationSize).toBe(2);
    expect(s.series).toHaveLength(1);
    expect(s.series[0].tables).toHaveLength(4);
    expect(s.hasData).toBe(true);
  });

  it('reconstructs table 1 as the exact 2v2 with the right winner', () => {
    const t1 = s.series[0].tables[0];
    expect(t1.home.map((p) => p.name)).toEqual(['Molander', 'H.Engberg']); // sorted by order
    expect(t1.homeTotal).toBe(355);
    expect(t1.awayTotal).toBe(356);
    expect(t1.winner).toBe('away'); // away by one pin
  });

  it('counts delmatch wins 2–2 and awards the serie pinfall point to home', () => {
    expect(s.homeDelmatchWins).toBe(2);
    expect(s.awayDelmatchWins).toBe(2);
    expect(s.series[0].homePinfall).toBe(1592);
    expect(s.series[0].awayPinfall).toBe(1500);
    expect(s.series[0].pinfallWinner).toBe('home');
  });

  it('totals banpoäng per §1.3 — max 5 in a serie (home 3, away 2)', () => {
    expect(s.homeBanp).toBe(3); // 2 delmatcher + 1 pinfall
    expect(s.awayBanp).toBe(2); // 2 delmatcher
    expect(s.homeBanp + s.awayBanp).toBe(5);
  });

  it('lists every delmatch a player took part in', () => {
    const played = playerDelmatcher(s, 'Molander');
    expect(played).toHaveLength(1);
    expect(played[0].isHome).toBe(true);
    expect(played[0].delmatch.away.map((p) => p.name)).toContain('Layrisse');
  });
});

describe('computeDelmatcher — 1v1 (4-man) and edges', () => {
  it('handles 1v1 with konstellation size 1', () => {
    const s = computeDelmatcher(slots(1, [
      [1, 1, true, 'A', 200], [1, 1, false, 'B', 180],
      [2, 1, true, 'C', 150], [2, 1, false, 'D', 190],
    ]));
    expect(s.konstellationSize).toBe(1);
    expect(s.series[0].tables[0].winner).toBe('home');
    expect(s.series[0].tables[1].winner).toBe('away');
    // pinfall: home 350 vs away 370 → away; banp home 1, away 2
    expect(s.homeBanp).toBe(1);
    expect(s.awayBanp).toBe(2);
  });

  it('scores a tied delmatch as no banpoäng to either side', () => {
    const s = computeDelmatcher(slots(1, [
      [1, 1, true, 'A', 200], [1, 1, false, 'B', 200],
    ]));
    expect(s.series[0].tables[0].winner).toBe('tie');
    expect(s.ties).toBe(1);
    // tied delmatch → no delmatch point; pinfall also tied → no point
    expect(s.homeBanp).toBe(0);
    expect(s.awayBanp).toBe(0);
  });

  it('accumulates banpoäng across multiple series', () => {
    const s = computeDelmatcher([
      ...slots(1, [[1, 1, true, 'A', 200], [1, 1, false, 'B', 100]]),   // home wins delmatch + pinfall
      ...slots(2, [[1, 1, true, 'A', 100], [1, 1, false, 'B', 200]]),   // away wins delmatch + pinfall
    ]);
    expect(s.series).toHaveLength(2);
    expect(s.homeBanp).toBe(2); // s1: 1+1
    expect(s.awayBanp).toBe(2); // s2: 1+1
  });

  it('returns empty summary for no rows', () => {
    const s = computeDelmatcher([]);
    expect(s.hasData).toBe(false);
    expect(s.series).toHaveLength(0);
    expect(s.homeBanp).toBe(0);
  });
});

describe('computePlayerDelmatchRecord (career)', () => {
  // One delmatch cell per match: home pair vs away pair.
  const cell = (
    matchId: number, date: string,
    home: [string, string, number][],   // [publicId, name, score]
    away: [string | null, string, number][],
  ): DelmatchRow[] => [
    ...home.map(([id, name, score], i): DelmatchRow => ({ matchId, date, serie: 1, tableNo: 1, order: i + 1, isHomeTeam: true, publicId: id, playerName: name, score })),
    ...away.map(([id, name, score], i): DelmatchRow => ({ matchId, date, serie: 1, tableNo: 1, order: i + 1, isHomeTeam: false, publicId: id, playerName: name, score })),
  ];

  const rows: DelmatchRow[] = [
    ...cell(1, '2025-01-01', [['ME', 'Me', 220], ['P1', 'Partner1', 200]], [['O1', 'Opp1', 190], ['O2', 'Opp2', 190]]), // win 420-380
    ...cell(2, '2025-02-01', [['ME', 'Me', 300], ['P1', 'Partner1', 250]], [['O1', 'Opp1', 200], ['O3', 'Opp3', 200]]), // win 550-400, 300 game
    ...cell(3, '2025-03-01', [['O1', 'Opp1', 180], ['O2', 'Opp2', 180]], [['ME', 'Me', 150], ['P2', 'Partner2', 150]]), // ME away, loss 300-360
  ];
  const r = computePlayerDelmatchRecord(rows, 'ME');

  it('computes the duel record from the player perspective', () => {
    expect(r.hasData).toBe(true);
    expect(r.record).toMatchObject({ wins: 2, losses: 1, ties: 0, played: 3 });
    expect(r.record.winRate).toBeCloseTo(2 / 3, 5);
  });

  it('tracks rivalries by opponent id with a running score, most-faced first', () => {
    expect(r.rivalries[0]).toMatchObject({ opponentId: 'O1', meetings: 3, wins: 2, losses: 1 });
    const o2 = r.rivalries.find((x) => x.opponentId === 'O2')!;
    expect(o2).toMatchObject({ meetings: 2, wins: 1, losses: 1 });
  });

  it('tracks partnerships (2v2 only) with W–L', () => {
    const p1 = r.partners.find((x) => x.partnerId === 'P1')!;
    expect(p1).toMatchObject({ together: 2, wins: 2, losses: 0 });
    const p2 = r.partners.find((x) => x.partnerId === 'P2')!;
    expect(p2).toMatchObject({ together: 1, wins: 0, losses: 1 });
  });

  it('captures milestones — best game, perfect games, best pair total, biggest margin', () => {
    expect(r.milestones.bestGame).toBe(300);
    expect(r.milestones.perfectGames).toBe(1);
    expect(r.milestones.bestPairTotal).toBe(550);
    expect(r.milestones.biggestWinMargin).toBe(150); // 550-400
  });

  it('orders recent duels newest first', () => {
    expect(r.recent.map((d) => d.matchId)).toEqual([3, 2, 1]);
    expect(r.recent[0].outcome).toBe('away'); // most recent was a loss
  });

  it('counts W/L against an unidentified opponent but omits them from rivalries', () => {
    const rr = computePlayerDelmatchRecord(
      cell(9, '2025-04-01', [['ME', 'Me', 200], ['P1', 'Partner1', 200]], [[null, 'Unknown', 100], [null, 'Unknown2', 100]]),
      'ME',
    );
    expect(rr.record.wins).toBe(1);
    expect(rr.rivalries).toHaveLength(0);
  });

  it('returns empty when the player is absent', () => {
    expect(computePlayerDelmatchRecord(rows, 'NOBODY').hasData).toBe(false);
  });
});
