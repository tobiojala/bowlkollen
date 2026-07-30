// Delmatch (bord) reconstruction — PURE + unit-tested. Turns the per-slot rows
// stored in bits_match_delmatch (see bits_match_delmatch.sql) into the real
// head-to-head structure: each serie, each physical bord, the home konstellation
// vs the away one, with the winner and banpoäng per Blåboken Kap D §1.
//
//   §1.3  won delmatch = 1 banpoäng; + 1 banpoäng to the team with the highest
//         combined pinfall that serie → max 5 poäng/serie.
//
// Works identically for 8-man (2v2) and 4-man (1v1) — the konstellation size just
// falls out of how many players share a (serie, table).

export type DelmatchSlot = {
  serie:      number;
  tableNo:    number;
  order:      number;
  isHomeTeam: boolean;
  playerName: string;
  publicId:   string | null;   // resolved profile id, when available
  score:      number;
};

export type DelmatchOutcome = 'home' | 'away' | 'tie';

export type DelmatchPlayer = { name: string; publicId: string | null; order: number; score: number };

export type Delmatch = {
  tableNo:   number;
  home:      DelmatchPlayer[];
  away:      DelmatchPlayer[];
  homeTotal: number;
  awayTotal: number;
  winner:    DelmatchOutcome;
};

export type DelmatchSerie = {
  serie:         number;
  tables:        Delmatch[];      // sorted by tableNo
  homePinfall:   number;          // all home players this serie
  awayPinfall:   number;
  pinfallWinner: DelmatchOutcome;
};

export type DelmatchSummary = {
  series:            DelmatchSerie[];
  homeBanp:          number;      // delmatch wins + serie-pinfall bonuses
  awayBanp:          number;
  homeDelmatchWins:  number;
  awayDelmatchWins:  number;
  ties:              number;      // tied delmatcher
  konstellationSize: number;      // 2 = 8-man (2v2), 1 = 4-man (1v1)
  hasData:           boolean;
};

const outcome = (h: number, a: number): DelmatchOutcome => (h > a ? 'home' : a > h ? 'away' : 'tie');

const toPlayers = (slots: DelmatchSlot[]): DelmatchPlayer[] =>
  slots
    .slice()
    .sort((x, y) => x.order - y.order)
    .map((s) => ({ name: s.playerName, publicId: s.publicId, order: s.order, score: s.score }));

const sum = (players: DelmatchPlayer[]) => players.reduce((t, p) => t + p.score, 0);

/** Reconstruct every delmatch + banpoäng from a match's slot rows. */
export function computeDelmatcher(slots: DelmatchSlot[]): DelmatchSummary {
  const empty: DelmatchSummary = {
    series: [], homeBanp: 0, awayBanp: 0, homeDelmatchWins: 0, awayDelmatchWins: 0,
    ties: 0, konstellationSize: 0, hasData: false,
  };
  if (!slots.length) return empty;

  const serieNos = [...new Set(slots.map((s) => s.serie))].sort((a, b) => a - b);
  let homeBanp = 0, awayBanp = 0, homeWins = 0, awayWins = 0, ties = 0, konSize = 0;

  const series: DelmatchSerie[] = serieNos.map((serieNo) => {
    const inSerie = slots.filter((s) => s.serie === serieNo);
    const tableNos = [...new Set(inSerie.map((s) => s.tableNo))].sort((a, b) => a - b);

    const tables: Delmatch[] = tableNos.map((tableNo) => {
      const cell = inSerie.filter((s) => s.tableNo === tableNo);
      const home = toPlayers(cell.filter((s) => s.isHomeTeam));
      const away = toPlayers(cell.filter((s) => !s.isHomeTeam));
      konSize = Math.max(konSize, home.length, away.length);
      const homeTotal = sum(home);
      const awayTotal = sum(away);
      const winner = outcome(homeTotal, awayTotal);
      if (winner === 'home') { homeBanp++; homeWins++; }
      else if (winner === 'away') { awayBanp++; awayWins++; }
      else ties++;
      return { tableNo, home, away, homeTotal, awayTotal, winner };
    });

    // §1.3 serie pinfall bonus — highest combined pinfall of all players that serie.
    const homePinfall = tables.reduce((t, d) => t + d.homeTotal, 0);
    const awayPinfall = tables.reduce((t, d) => t + d.awayTotal, 0);
    const pinfallWinner = outcome(homePinfall, awayPinfall);
    if (pinfallWinner === 'home') homeBanp++;
    else if (pinfallWinner === 'away') awayBanp++;

    return { serie: serieNo, tables, homePinfall, awayPinfall, pinfallWinner };
  });

  return {
    series, homeBanp, awayBanp,
    homeDelmatchWins: homeWins, awayDelmatchWins: awayWins,
    ties, konstellationSize: konSize, hasData: true,
  };
}

/** All delmatcher a given player (by publicId) took part in, newest serie first. */
export function playerDelmatcher(
  summary: DelmatchSummary,
  publicId: string,
): { serie: number; delmatch: Delmatch; isHome: boolean }[] {
  const out: { serie: number; delmatch: Delmatch; isHome: boolean }[] = [];
  for (const s of summary.series) {
    for (const d of s.tables) {
      if (d.home.some((p) => p.publicId === publicId)) out.push({ serie: s.serie, delmatch: d, isHome: true });
      else if (d.away.some((p) => p.publicId === publicId)) out.push({ serie: s.serie, delmatch: d, isHome: false });
    }
  }
  return out;
}

// ─── career record across many matches ───────────────────────────────────────
// A player's whole delmatch history: their duel W–L, the rivals they've faced
// most (running score), the partners they've won most with, and milestones.
// ALWAYS keyed on publicId — never the name — so namesakes never merge.

export type DelmatchRow = DelmatchSlot & { matchId: number; date: string | null };

export type DuelRecord = { wins: number; losses: number; ties: number; played: number; winRate: number };
export type Rivalry = { opponentId: string; opponentName: string; meetings: number; wins: number; losses: number; ties: number };
export type Partnership = { partnerId: string; partnerName: string; together: number; wins: number; losses: number; ties: number };
export type DelmatchMilestones = { bestGame: number; perfectGames: number; bestPairTotal: number; biggestWinMargin: number };
export type RecentDuel = { matchId: number; date: string | null; outcome: DelmatchOutcome; ownScore: number; opponents: string[] };

export type PlayerDelmatchRecord = {
  record:     DuelRecord;
  rivalries:  Rivalry[];       // most-faced first
  partners:   Partnership[];   // most-played-with first (empty for 1v1 formats)
  milestones: DelmatchMilestones;
  recent:     RecentDuel[];    // newest first
  hasData:    boolean;
};

const PERFECT_GAME = 300;

/** Aggregate one player's entire delmatch history from raw slot rows. */
export function computePlayerDelmatchRecord(rows: DelmatchRow[], playerId: string): PlayerDelmatchRecord {
  const empty: PlayerDelmatchRecord = {
    record: { wins: 0, losses: 0, ties: 0, played: 0, winRate: 0 },
    rivalries: [], partners: [],
    milestones: { bestGame: 0, perfectGames: 0, bestPairTotal: 0, biggestWinMargin: 0 },
    recent: [], hasData: false,
  };
  if (!rows.length || !playerId) return empty;

  // Group into delmatch cells: matchId | serie | table.
  const cells = new Map<string, DelmatchRow[]>();
  for (const r of rows) {
    const k = `${r.matchId}|${r.serie}|${r.tableNo}`;
    const arr = cells.get(k);
    if (arr) arr.push(r); else cells.set(k, [r]);
  }

  const rec: DuelRecord = { wins: 0, losses: 0, ties: 0, played: 0, winRate: 0 };
  const ms: DelmatchMilestones = { bestGame: 0, perfectGames: 0, bestPairTotal: 0, biggestWinMargin: 0 };
  const rivals = new Map<string, Rivalry>();
  const partners = new Map<string, Partnership>();
  const recent: RecentDuel[] = [];

  const bumpRival = (id: string, name: string, res: DelmatchOutcome) => {
    const o = rivals.get(id) ?? { opponentId: id, opponentName: name, meetings: 0, wins: 0, losses: 0, ties: 0 };
    o.meetings++; o.opponentName = name;
    if (res === 'home') o.wins++; else if (res === 'away') o.losses++; else o.ties++;
    rivals.set(id, o);
  };
  const bumpPartner = (id: string, name: string, res: DelmatchOutcome) => {
    const o = partners.get(id) ?? { partnerId: id, partnerName: name, together: 0, wins: 0, losses: 0, ties: 0 };
    o.together++; o.partnerName = name;
    if (res === 'home') o.wins++; else if (res === 'away') o.losses++; else o.ties++;
    partners.set(id, o);
  };

  for (const cell of cells.values()) {
    const me = cell.find((r) => r.publicId === playerId);
    if (!me) continue;
    const mine = cell.filter((r) => r.isHomeTeam === me.isHomeTeam);
    const theirs = cell.filter((r) => r.isHomeTeam !== me.isHomeTeam);
    if (!theirs.length) continue;

    const myTotal = mine.reduce((t, r) => t + r.score, 0);
    const oppTotal = theirs.reduce((t, r) => t + r.score, 0);
    // Outcome FROM THE PLAYER'S PERSPECTIVE, expressed on the shared scale:
    // 'home' = player's side won, 'away' = lost, 'tie' = drawn.
    const res: DelmatchOutcome = myTotal > oppTotal ? 'home' : oppTotal > myTotal ? 'away' : 'tie';

    rec.played++;
    if (res === 'home') rec.wins++; else if (res === 'away') rec.losses++; else rec.ties++;

    ms.bestGame = Math.max(ms.bestGame, me.score);
    if (me.score >= PERFECT_GAME) ms.perfectGames++;
    ms.bestPairTotal = Math.max(ms.bestPairTotal, myTotal);
    if (res === 'home') ms.biggestWinMargin = Math.max(ms.biggestWinMargin, myTotal - oppTotal);

    for (const p of mine) if (p.publicId && p.publicId !== playerId) bumpPartner(p.publicId, p.playerName, res);
    for (const o of theirs) if (o.publicId) bumpRival(o.publicId, o.playerName, res);

    recent.push({ matchId: me.matchId, date: me.date, outcome: res, ownScore: me.score, opponents: theirs.map((t) => t.playerName) });
  }

  if (!rec.played) return empty;
  rec.winRate = rec.wins / ((rec.wins + rec.losses) || 1);

  recent.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.matchId - a.matchId);

  const byCount = <T extends { meetings?: number; together?: number }>(a: T, b: T) =>
    ((b.meetings ?? b.together ?? 0) - (a.meetings ?? a.together ?? 0));

  return {
    record: rec,
    rivalries: [...rivals.values()].sort(byCount),
    partners: [...partners.values()].sort(byCount),
    milestones: ms,
    recent,
    hasData: true,
  };
}
