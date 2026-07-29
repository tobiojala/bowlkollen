import { candidateEligibility, lineupEligibilityIssues, type EligibilityInput } from '@/lib/eligibility';

const base: EligibilityInput = {
  targetIsFarmTeam: true,
  isFinalRounds: false,
  playedHigherThisRound: false,
  lockedByFinalRule: false,
};

describe('candidateEligibility (§ D 306)', () => {
  it('top/representation team → always ok (no higher club team)', () => {
    expect(candidateEligibility({ ...base, targetIsFarmTeam: false, playedHigherThisRound: true }).state).toBe('ok');
  });

  it('farm team, clean player, normal round → ok', () => {
    expect(candidateEligibility(base).state).toBe('ok');
  });

  it('played a higher club team this round, normal round → restricted (only the free slot)', () => {
    expect(candidateEligibility({ ...base, playedHigherThisRound: true }).state).toBe('restricted');
  });

  it('played higher this round in the final rounds → blocked (no free slot then)', () => {
    expect(candidateEligibility({ ...base, playedHigherThisRound: true, isFinalRounds: true }).state).toBe('blocked');
  });

  it('final-round lock (§ D 306.4) → blocked', () => {
    expect(candidateEligibility({ ...base, lockedByFinalRule: true }).state).toBe('blocked');
  });

  it('unknown higher-team participation → unknown, never a false ok', () => {
    expect(candidateEligibility({ ...base, playedHigherThisRound: null }).state).toBe('unknown');
  });

  it('final rounds with unknown lock data → unknown', () => {
    expect(candidateEligibility({ ...base, isFinalRounds: true, lockedByFinalRule: null }).state).toBe('unknown');
  });

  it('clean player outside final rounds is ok even if lock data is null (rule N/A)', () => {
    expect(candidateEligibility({ ...base, lockedByFinalRule: null }).state).toBe('ok');
  });
});

describe('lineupEligibilityIssues', () => {
  it('one restricted (free) player in a normal round → no issue', () => {
    expect(lineupEligibilityIssues(['ok', 'ok', 'restricted'], false)).toHaveLength(0);
  });

  it('two restricted players → over the one-free-player limit', () => {
    expect(lineupEligibilityIssues(['restricted', 'restricted', 'ok'], false).length).toBeGreaterThan(0);
  });

  it('any restricted player in the final rounds → issue', () => {
    expect(lineupEligibilityIssues(['ok', 'restricted'], true).length).toBeGreaterThan(0);
  });

  it('a blocked player is always a violation', () => {
    expect(lineupEligibilityIssues(['ok', 'blocked'], false).length).toBeGreaterThan(0);
  });

  it('all clean → no issues', () => {
    expect(lineupEligibilityIssues(['ok', 'ok', 'unknown'], true)).toHaveLength(0);
  });
});
