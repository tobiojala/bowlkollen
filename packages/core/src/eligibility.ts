// SvBF § D 306 farm-team eligibility ("spärr") engine — PURE + unit-tested so the rules
// are verifiable independent of the data feed. Club team ranking: A-lag → F1 → F2 → …
// Lives in @bowlkollen/core so web and native share ONE engine (a wrong verdict can
// forfeit a match — it must not diverge between apps). Each app supplies its own data
// resolver that turns match data into the SIGNALS below.
//
// The engine works on SIGNALS a data resolver provides per candidate. Where the data
// can't answer, the verdict is 'unknown' (advisory) — NEVER a false 'ok', because a wrong
// green light could forfeit a match. Only farm teams carry these restrictions.
//
// Rules encoded (§ D 306, extracted from Blå Boken kap D):
//   1.1  a farm team may field max ONE "free" player exempt from the restrictions —
//        EXCEPT in the season's last two grundserie rounds (then none).
//   2    every other member may not actively play more than one of the club's teams in the
//        same serieomgång (round).
//   4/5  a player who played a higher-ranked team in the farm team's second-to-last (or
//        last / qual) round may not then play the farm team in its last round / qual.

export type EligibilityState = 'ok' | 'restricted' | 'blocked' | 'unknown';

export type EligibilityInput = {
  // Seating INTO a farm team (a higher-ranked team of the same club plays this round)?
  targetIsFarmTeam: boolean;
  // This match is in the season's last two grundserie rounds (no "free" player allowed).
  isFinalRounds: boolean;
  // Did the player actively play a HIGHER-ranked club team in THIS match's round? null = unknown.
  playedHigherThisRound: boolean | null;
  // § D 306.4/5: player played a higher club team in the farm team's second-to-last/last
  // round and this match is the subsequent last round / qual. null = unknown.
  lockedByFinalRule: boolean | null;
};

export type EligibilityVerdict = { state: EligibilityState; reason: string };

export function candidateEligibility(i: EligibilityInput): EligibilityVerdict {
  // A non-farm team (the top/representation team) has no higher club team → no restriction.
  if (!i.targetIsFarmTeam) return { state: 'ok', reason: '' };

  // Final-round lock (§ D 306.4/5): a hard block — no free-slot exemption exists then.
  if (i.lockedByFinalRule === true) {
    return { state: 'blocked', reason: 'Spelade högre lag i näst sista omgången — spärrad sista omgången (§ D 306.4)' };
  }

  // Played a higher club team this round (§ D 306.2). Allowed ONLY as the single free
  // player (§ D 306.1.1), and not at all in the final rounds.
  if (i.playedHigherThisRound === true) {
    return i.isFinalRounds
      ? { state: 'blocked', reason: 'Spelade högre lag samma omgång — ingen fri spelare de två sista omgångarna (§ D 306)' }
      : { state: 'restricted', reason: 'Spelade högre lag samma omgång — endast tillåten som lagets enda fria spelare (§ D 306.1.1)' };
  }

  // Below here the player did NOT play higher this round (false) or we don't know (null).
  if (i.playedHigherThisRound === null) {
    return { state: 'unknown', reason: 'Kan inte verifiera spärr — kontrollera själv (§ D 306)' };
  }
  if (i.isFinalRounds && i.lockedByFinalRule === null) {
    return { state: 'unknown', reason: 'Kan inte verifiera slutomgångsspärr — kontrollera själv (§ D 306.4)' };
  }
  return { state: 'ok', reason: '' };
}

// Lineup-level check across the seated starters: at most ONE 'restricted' (free) player,
// and none at all in the final rounds; any 'blocked' player is a violation.
export function lineupEligibilityIssues(states: EligibilityState[], isFinalRounds: boolean): string[] {
  const issues: string[] = [];
  const restricted = states.filter((s) => s === 'restricted').length;
  const blocked = states.filter((s) => s === 'blocked').length;

  if (blocked > 0) issues.push(`${blocked} spärrad spelare i laguppställningen (§ D 306)`);
  if (isFinalRounds && restricted > 0) {
    issues.push('Ingen nedflyttad spelare tillåts de två sista omgångarna (§ D 306.1.1)');
  } else if (restricted > 1) {
    issues.push(`Max en nedflyttad spelare tillåten — ${restricted} valda (§ D 306.1.1)`);
  }
  return issues;
}
