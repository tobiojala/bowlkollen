import {
  calcRating,
  characterSentence,
  computePlayerStats,
  consistencyLabel,
  cumulativeAvgPoints,
  gamePositionAvgs,
  narrativeParagraph,
  rhythmLabel,
  splitSeason,
  streaks,
  getTier,
  matchTrendPoints,
  playerAchievements,
  rollingRatingPoints,
  projectSeasonAvg,
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

describe('projectSeasonAvg', () => {
  it('is null with too few matches or no season average', () => {
    expect(projectSeasonAvg([180, 190, 200], 190)).toBeNull();
    expect(projectSeasonAvg([180, 190, 200, 210], null)).toBeNull();
  });
  it('projects upward for a rising trend', () => {
    const avgs = [170, 180, 190, 200, 210];
    const proj = projectSeasonAvg(avgs, 190)!;
    expect(proj).not.toBeNull();
    expect(proj).toBeGreaterThan(190);
  });
  it('projects downward for a falling trend', () => {
    expect(projectSeasonAvg([210, 200, 190, 180, 170], 190)!).toBeLessThan(190);
  });
  it('clamps so noise cannot produce a wild number', () => {
    const avgs = [180, 182, 181, 183, 182];
    const proj = projectSeasonAvg(avgs, 182)!;
    expect(proj).toBeLessThanOrEqual(Math.max(...avgs) + 15);
    expect(proj).toBeGreaterThanOrEqual(Math.min(...avgs) - 15);
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

describe('matchTrendPoints', () => {
  const m = (date: string, series: number[] | null, opponent: string | null = null) => ({
    match_date: date, opponent_name: opponent, division_name: null, total_result: null, is_home_team: null, series,
  });
  it('sorts chronological and averages each match', () => {
    const pts = matchTrendPoints([m('2026-02-01', [200, 220]), m('2026-01-01', [180, 200])]);
    expect(pts.map((p) => p.date)).toEqual(['2026-01-01', '2026-02-01']);
    expect(pts[0].avg).toBe(190);
    expect(pts[1].avg).toBe(210);
  });
  it('skips matches with no games and keeps the opponent label', () => {
    const pts = matchTrendPoints([m('2026-01-01', [], 'X'), m('2026-01-02', [210], 'Erik')]);
    expect(pts).toHaveLength(1);
    expect(pts[0]).toMatchObject({ avg: 210, label: 'Erik' });
  });
});

describe('rollingRatingPoints', () => {
  const m = (date: string, series: number[] | null, opponent: string | null = null) => ({
    match_date: date, opponent_name: opponent, division_name: null, total_result: null, is_home_team: null, series,
  });
  it('recomputes the rating cumulatively per match, chronological', () => {
    const pts = rollingRatingPoints([m('2026-02-01', [230, 240]), m('2026-01-01', [150, 160])]);
    expect(pts.map((p) => p.date)).toEqual(['2026-01-01', '2026-02-01']);
    // rating after the strong second match should exceed the weak first
    expect(pts[1].avg).toBeGreaterThan(pts[0].avg);
    expect(pts.every((p) => p.avg >= 0 && p.avg <= 99)).toBe(true);
  });
  it('skips matches with no games', () => {
    expect(rollingRatingPoints([m('2026-01-01', []), m('2026-01-02', [200])])).toHaveLength(1);
  });
});

describe('season-analysis engine', () => {
  const m = (series: number[]) => ({
    match_date: '2026-01-01', opponent_name: null, division_name: null, total_result: null, is_home_team: null, series,
  });
  it('streaks: current and best runs at/above threshold', () => {
    expect(streaks([210, 220, 190, 205, 230], 200)).toEqual({ current: 2, best: 2 });
    expect(streaks([190, 210, 220, 205], 200)).toEqual({ current: 3, best: 3 });
  });
  it('consistencyLabel maps std-dev to a word', () => {
    expect(consistencyLabel(15)).toBe('Konsekvent');
    expect(consistencyLabel(25)).toBe('Stabil');
    expect(consistencyLabel(35)).toBe('Varierad');
    expect(consistencyLabel(45)).toBe('Explosiv');
  });
  it('gamePositionAvgs averages by slot across varying lengths', () => {
    // slot1: (180+200)/2=190, slot2: (200+220)/2=210, slot3: only first match =240
    expect(gamePositionAvgs([m([180, 200, 240]), m([200, 220])])).toEqual([190, 210, 240]);
  });
  it('rhythmLabel reads a strong finisher', () => {
    expect(rhythmLabel([180, 190, 205]).label).toBe('Stark avslutare');
  });
  it('characterSentence and narrativeParagraph produce copy without pronouns', () => {
    const c = characterSentence({ hitRate: 70, formDiff: 5, consistency: 'Stabil', seasonAvg: 205, bestSeries: 700 });
    expect(c).toContain('Dominant');
    const n = narrativeParagraph({
      firstName: 'Alex', seasonAvg: 205, lastSeasonAvg: 195, formDiff: 12, hitRate: 60,
      consistency: 'Stabil', rhythmLabel: 'Stark avslutare', bestSeries: 700, games200Plus: 8, totalGames: 12,
    });
    expect(n).toHaveLength(4);
    expect(n[0]).toContain('Alex');
    expect(n.join(' ')).not.toMatch(/\b(hon|han|henne|honom)\b/);
  });
});

describe('splitSeason', () => {
  const m = (date: string, series: number[]) => ({
    match_date: date, opponent_name: null, division_name: null, total_result: null, is_home_team: null, series,
  });
  it('splits current vs previous season and reads last-season avg', () => {
    const r = splitSeason([m('2026-08-01', [200, 210]), m('2025-10-01', [180, 200]), m('2025-11-01', [190, 210])]);
    expect(r.activeRows).toHaveLength(1);
    expect(r.prevRows).toHaveLength(2);
    expect(r.lastSeasonAvg).toBe(195); // (180+200+190+210)/4
    expect(r.prevMatchAvgs).toEqual([190, 200]);
  });
  it('falls back to all history in the offseason (no current-season rows)', () => {
    const r = splitSeason([m('2025-10-01', [180, 200])]);
    expect(r.activeRows).toHaveLength(1);
    expect(r.lastSeasonAvg).toBe(190);
  });
});

describe('cumulativeAvgPoints', () => {
  const m = (date: string, series: number[] | null) => ({
    match_date: date, opponent_name: null, division_name: null, total_result: null, is_home_team: null, series,
  });
  it('is the running average of all games so far, not the per-match average', () => {
    const pts = cumulativeAvgPoints([m('2026-01-01', [100, 100]), m('2026-01-02', [220, 220])]);
    expect(pts[0].avg).toBe(100); // 200/2
    expect(pts[1].avg).toBe(160); // (100+100+220+220)/4 — smoothed toward, not 220
  });
});
