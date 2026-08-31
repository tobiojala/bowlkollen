// Shared serie-bar math so every card that graphs a series — home feed, matchlogg,
// story cards — draws bars identically on web and native, and can't drift.
//
// Heights are ABSOLUTE (LOW→HIGH), not per-card min→max, so a big game reads tall
// in ANY card and bars are comparable across posts. Colour is decided by tier, with
// gold reserved for a genuine high game (>= SERIE_GOLD_MIN) to keep the gold budget
// tight — a strong-but-not-huge game reads tall but stays ink.

export const SERIE_BAR = { H: 80, FLOOR: 0.1, LOW: 110, HIGH: 300 } as const;

/** A single game at/above this is a genuine high game → gold. */
export const SERIE_GOLD_MIN = 250;

/** Pixel height of a game's bar on an `h`-tall track (default SERIE_BAR.H). */
export function serieBarHeight(game: number, h: number = SERIE_BAR.H): number {
  const frac = Math.max(0, Math.min(1, (game - SERIE_BAR.LOW) / (SERIE_BAR.HIGH - SERIE_BAR.LOW)));
  return Math.round((SERIE_BAR.FLOOR + (1 - SERIE_BAR.FLOOR) * frac) * h);
}

export type SerieBarLevel = 'gold' | 'strong' | 'mid' | 'low';

/** Colour tier for a game. `gold` is the milestone; the rest step down in ink. */
export function serieBarLevel(game: number): SerieBarLevel {
  if (game >= SERIE_GOLD_MIN) return 'gold';
  if (game >= 210) return 'strong';
  if (game >= 170) return 'mid';
  return 'low';
}
