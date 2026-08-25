// Delmatch (bord) reconstruction now lives in @bowlkollen/core so web + native
// share it verbatim. Re-exported here so existing `@/lib/delmatch` imports (and
// the delmatch test) keep working unchanged.
export {
  computeDelmatcher,
  playerDelmatcher,
  computePlayerDelmatchRecord,
} from '@bowlkollen/core';
export type {
  DelmatchSlot,
  DelmatchOutcome,
  DelmatchPlayer,
  Delmatch,
  DelmatchSerie,
  DelmatchSummary,
  DelmatchRow,
  DuelRecord,
  Rivalry,
  Partnership,
  DelmatchMilestones,
  RecentDuel,
  PlayerDelmatchRecord,
} from '@bowlkollen/core';
