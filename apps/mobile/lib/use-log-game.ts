import { useReducer } from 'react';
import { scoreGame, frameMarks, type Game } from '@bowlkollen/core';

// State machine for logging a game via the pin deck (parity with web). Each ball
// you tap the pins left STANDING; pinfall is derived, the game is scored by
// @bowlkollen/core, and open frames' leaves are captured for Spärranalys.
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
type Leave = { frame: number; pins: number[]; converted: boolean; residual: number[] };
type S = {
  rolls: number[]; frame: number; ball: number;
  available: number[]; standing: number[]; leaves: Leave[]; done: boolean; history: string[];
};
const INIT: S = { rolls: [], frame: 0, ball: 1, available: [...ALL], standing: [], leaves: [], done: false, history: [] };

type Action = { type: 'toggle'; pin: number } | { type: 'confirm' } | { type: 'undo' } | { type: 'reset' };
const snap = (s: S): string => { const { history: _h, ...rest } = s; return JSON.stringify(rest); };

function reducer(s: S, a: Action): S {
  if (a.type === 'reset') return { ...INIT, available: [...ALL] };
  if (a.type === 'undo') {
    if (!s.history.length) return s;
    const prev = JSON.parse(s.history[s.history.length - 1]) as Omit<S, 'history'>;
    return { ...prev, history: s.history.slice(0, -1) };
  }
  if (a.type === 'toggle') {
    if (s.done || !s.available.includes(a.pin)) return s;
    const standing = s.standing.includes(a.pin) ? s.standing.filter((p) => p !== a.pin) : [...s.standing, a.pin];
    return { ...s, standing };
  }
  if (s.done) return s;
  const rolls = [...s.rolls, s.available.length - s.standing.length];
  const surv = [...s.standing];
  let ns: S = { ...s, rolls, standing: [], history: [...s.history, snap(s)] };
  if (s.frame < 9) {
    if (s.ball === 1) {
      if (surv.length === 0) ns = { ...ns, frame: s.frame + 1, ball: 1, available: [...ALL] };
      else ns = { ...ns, ball: 2, available: surv, leaves: [...s.leaves, { frame: s.frame, pins: surv, converted: false, residual: [] }] };
    } else {
      const leaves = s.leaves.map((l) => l.frame === s.frame ? { ...l, converted: surv.length === 0, residual: surv } : l);
      ns = { ...ns, leaves, frame: s.frame + 1, ball: 1, available: [...ALL] };
    }
  } else {
    if (s.ball === 1) ns = { ...ns, ball: 2, available: surv.length === 0 ? [...ALL] : surv };
    else if (s.ball === 2) {
      const strike1 = rolls[rolls.length - 2] === 10;
      if (strike1) ns = { ...ns, ball: 3, available: surv.length === 0 ? [...ALL] : surv };
      else if (surv.length === 0) ns = { ...ns, ball: 3, available: [...ALL] };
      else ns = { ...ns, done: true };
    } else ns = { ...ns, done: true };
  }
  return ns;
}

export type LogGameApi = ReturnType<typeof useLogGame>;
export function useLogGame() {
  const [s, dispatch] = useReducer(reducer, INIT);
  const { frames: cum, total } = scoreGame(s.rolls);
  const game: Game | null = s.done
    ? { rolls: s.rolls, total, leaves: s.leaves.map((l) => ({ frame: l.frame, pins: l.pins, converted: l.converted })) }
    : null;
  return {
    rolls: s.rolls, frame: s.frame, ball: s.ball, done: s.done,
    available: new Set(s.available), standing: new Set(s.standing),
    leaves: s.leaves, marks: frameMarks(s.rolls), cum, total, game, canUndo: s.history.length > 0,
    toggle: (pin: number) => dispatch({ type: 'toggle', pin }),
    confirm: () => dispatch({ type: 'confirm' }),
    undo: () => dispatch({ type: 'undo' }),
    reset: () => dispatch({ type: 'reset' }),
  };
}
