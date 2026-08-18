// SvBF § D 306 farm-team eligibility engine — moved to @bowlkollen/core so web and
// native share ONE engine (a wrong verdict can forfeit a match; it must not diverge).
// Re-exported here so existing `@/lib/eligibility` imports and the native test keep
// working. Each app supplies its own data resolver (native: lib/eligibility-data.ts).
export {
  candidateEligibility,
  lineupEligibilityIssues,
  type EligibilityState,
  type EligibilityInput,
  type EligibilityVerdict,
} from '@bowlkollen/core';
