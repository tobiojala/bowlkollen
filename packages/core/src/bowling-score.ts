// Ten-pin scoring — one shared implementation so web + native (and the diary/
// logbook) can never disagree on a total. A game is a flat list of rolls (pins
// per ball); everything else derives from it.

/** A scored game as stored on a logbook entry: the rolls plus the computed total. */
export type Game = { rolls: number[]; total: number }

/** Split a flat roll list into frames (1–9: strike = 1 roll else 2; 10th = up to 3). */
export function framesOf(rolls: number[]): number[][] {
  const frames: number[][] = [];
  let i = 0;
  for (let f = 0; f < 10 && i < rolls.length; f++) {
    if (f < 9) {
      if (rolls[i] === 10) { frames.push([10]); i += 1; }
      else { frames.push(rolls.slice(i, i + 2)); i += 2; }
    } else {
      frames.push(rolls.slice(i)); i = rolls.length;
    }
  }
  return frames;
}

function frameDone(fr: number[], idx: number): boolean {
  if (idx < 9) return fr[0] === 10 || fr.length === 2;
  const bonus = fr.length >= 2 && (fr[0] === 10 || fr[0] + fr[1] === 10);
  return bonus ? fr.length === 3 : fr.length === 2;
}

/** Cumulative score per frame (null while a strike/spare still awaits its bonus balls), and the running total. */
export function scoreGame(rolls: number[]): { frames: (number | null)[]; total: number } {
  const out: (number | null)[] = [];
  let t = 0, i = 0;
  for (let f = 0; f < 10; f++) {
    if (rolls[i] === undefined) { out.push(null); continue; }
    if (rolls[i] === 10) {                                   // strike
      if (rolls[i + 1] !== undefined && rolls[i + 2] !== undefined) { t += 10 + rolls[i + 1] + rolls[i + 2]; out.push(t); } else out.push(null);
      i += 1;
    } else if (rolls[i] + (rolls[i + 1] ?? -99) === 10) {    // spare (both balls in)
      if (rolls[i + 2] !== undefined) { t += 10 + rolls[i + 2]; out.push(t); } else out.push(null);
      i += 2;
    } else if (rolls[i + 1] !== undefined) {                 // open frame
      t += rolls[i] + rolls[i + 1]; out.push(t); i += 2;
    } else { out.push(null); i += 2; }                       // first ball only
  }
  const done = out.filter((x): x is number => x !== null);
  return { frames: out, total: done.length ? done[done.length - 1] : 0 };
}

/** Final running total (0 for an empty game). */
export const gameTotal = (rolls: number[]): number => scoreGame(rolls).total;

/** Whether all ten frames (incl. 10th bonus balls) are filled. */
export function isGameComplete(rolls: number[]): boolean {
  const f = framesOf(rolls);
  return f.length === 10 && frameDone(f[9], 9);
}

/** Highest legal value for the next ball (for clamping the input pad). 0 when the game is done. */
export function maxNextRoll(rolls: number[]): number {
  if (isGameComplete(rolls)) return 0;
  const f = framesOf(rolls);
  const idx = f.length - 1;
  const last = idx >= 0 ? f[idx] : undefined;
  if (!last || frameDone(last, idx)) return 10;              // start of a new frame
  if (idx < 9) return 10 - last[0];                          // second ball of frames 1–9
  if (last.length === 1) return last[0] === 10 ? 10 : 10 - last[0];  // 10th, second ball
  return last[1] === 10 ? 10 : (last[0] === 10 ? 10 - last[1] : 10); // 10th, third ball
}

/** Per-frame ball marks for display: 'X' strike, '/' spare, '–' miss, else the number. */
export function frameMarks(rolls: number[]): string[][] {
  const mark = (v: number) => (v === 10 ? 'X' : v === 0 ? '–' : String(v));
  return framesOf(rolls).map((fr, idx) => {
    if (idx < 9) {
      const b: string[] = [];
      if (fr[0] !== undefined) b.push(fr[0] === 10 ? 'X' : mark(fr[0]));
      if (fr[0] !== 10 && fr[1] !== undefined) b.push(fr[0] + fr[1] === 10 ? '/' : mark(fr[1]));
      return b;
    }
    const b: string[] = [];
    if (fr[0] !== undefined) b.push(mark(fr[0]));
    if (fr[1] !== undefined) b.push(fr[0] !== 10 && fr[0] + fr[1] === 10 ? '/' : mark(fr[1]));
    if (fr[2] !== undefined) b.push(fr[1] !== 10 && fr[1] + fr[2] === 10 ? '/' : mark(fr[2]));
    return b;
  });
}
