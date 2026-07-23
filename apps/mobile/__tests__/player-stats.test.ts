import {
  calcRating,
  computePlayerStats,
  getTier,
  playerAchievements,
  stdDev,
  type PlayerMatch,
} from '@/lib/player-stats';

const match = (date: string, series: number[]): PlayerMatch => ({
  match_date: date,
  opponent_name: 'Motståndare',
  division_name: 'Division 1',
  total_result: series.reduce((a, b) => a + b, 0),
  is_home_team: true,
  series,
});

describe('stdDev', () => {
  it('is 0 for fewer than two values', () => {
    expect(stdDev([])).toBe(0);
    expect(stdDev([200])).toBe(0);
  });
  it('measures spread', () => {
    expect(stdDev([100, 100, 100])).toBe(0);
    expect(stdDev([190, 210])).toBe(10);
  });
});

describe('calcRating', () => {
  it('caps at 99 and never exceeds', () => {
    expect(calcRating(300, 300, 50, true)).toBe(99);
  });
  it('uses the low-data fallback when there is no data', () => {
    expect(calcRating(200, 0, 0, false)).toBe(Math.min(55, Math.round(200 * 0.3)));
  });
  it('blends avg, best game and 200+ volume', () => {
    // 180*0.4 + (240/40)*0.4 + 3*1.5 = 72 + 2.4 + 4.5 = 78.9 -> 79
    expect(calcRating(180, 240, 3, true)).toBe(79);
  });
});

describe('getTier', () => {
  it('maps rating to the right tier label', () => {
    expect(getTier(96).label).toBe('LEGEND');
    expect(getTier(90).label).toBe('ELIT');
    expect(getTier(80).label).toBe('PROFFS');
    expect(getTier(65).label).toBe('VETERAN');
    expect(getTier(40).label).toBe('ROOKIE');
  });
});

describe('computePlayerStats', () => {
  it('returns empty-ish stats for no history', () => {
    const s = computePlayerStats([]);
    expect(s.seasonAvg).toBeNull();
    expect(s.matchesPlayed).toBe(0);
    expect(s.gamesPlayed).toBe(0);
    expect(s.matchAvgs).toEqual([]);
    expect(s.rating).toBe(0);
  });

  it('derives averages, bests, counts and ordering', () => {
    const s = computePlayerStats([
      match('2026-09-01', [180, 200, 220]), // avg 200
      match('2026-09-08', [150, 210, 240]), // avg 200, best game 240
    ]);
    expect(s.matchesPlayed).toBe(2);
    expect(s.gamesPlayed).toBe(6);
    expect(s.seasonAvg).toBe(200);
    expect(s.bestGame).toBe(240);
    expect(s.bestSeries).toBe(600); // both matches total 600
    expect(s.games200).toBe(4); // 200,220,210,240
    expect(s.hitRate).toBe(Math.round((4 / 6) * 100));
    expect(s.matchAvgs).toEqual([200, 200]);
    // history is newest-first
    expect(s.historyDesc[0].match_date).toBe('2026-09-08');
  });

  it('ignores zero/blank games', () => {
    const s = computePlayerStats([match('2026-09-01', [0, 200, 0])]);
    expect(s.gamesPlayed).toBe(1);
    expect(s.seasonAvg).toBe(200);
  });

  it('computes form as recent vs season', () => {
    const older = Array.from({ length: 4 }, (_, i) => match(`2026-09-0${i + 1}`, [150, 150, 150]));
    const recent = Array.from({ length: 3 }, (_, i) => match(`2026-10-0${i + 1}`, [210, 210, 210]));
    const s = computePlayerStats([...older, ...recent]);
    expect(s.recentAvg).toBe(210); // last 9 games are all 210
    expect(s.formDiff).not.toBeNull();
    expect(s.formDiff!).toBeGreaterThan(0); // trending up
  });
});

describe('playerAchievements', () => {
  it('awards a 300 badge for a perfect game', () => {
    const s = computePlayerStats([match('2026-09-01', [300, 200, 210])]);
    expect(playerAchievements(s).some((a) => a.id === '300')).toBe(true);
  });
  it('awards a 200-average badge and match-count milestone', () => {
    const games = Array.from({ length: 10 }, (_, i) => match(`2026-09-${String(i + 1).padStart(2, '0')}`, [200, 205, 210]));
    const ids = playerAchievements(computePlayerStats(games)).map((a) => a.id);
    expect(ids).toContain('avg200');
    expect(ids).toContain('m10');
  });
  it('awards nothing for a modest, short season', () => {
    expect(playerAchievements(computePlayerStats([match('2026-09-01', [140, 150])]))).toEqual([]);
  });
});
