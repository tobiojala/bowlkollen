# Soft-launch plan — 16 days

Target: **invite-only soft launch ~16 days out** (from 2026-06-13 → ~Jun 29).
A soft launch is **not** the full redesign rollout (`REDESIGN_PLAN.md`). It is:
the *spine* redesigned and beautiful, everything else functional and inheriting
tokens, real data live, claim + guardrails working, **no paywall** (we launch
free — that whole workstream is deferred).

## What the monetization decision already removed

Launch is **free** → no Stripe, no billing, no active gating. We only *tag*
PRO features with `requiresPro` as we build. One less workstream in 16 days.

## Grounded starting point (already built)

- Player profile is **already on real data** (`PlayerClient.tsx` + PlayerDNA /
  MatchLog / EditSheet). Work = reconcile mockup *design* onto it, not rewire.
- Claim model exists (`player_claims`, `club_claims`, status `pending →
  verified`). At invite scale, **approval is manual** — no automation to build.
- BITS import scripts exist (`scripts/import-bits-*`).
- 82 tests green; design system + sheets + hero deck + BK Rating sheet done.

## The launch-blockers (the only must-haves)

1. **Spine redesigned on real data**: Home (first impression), Player profile
   (the showcase), Match detail (tapped constantly).
2. **Claim flow solid** end-to-end + a manual approval process for the cohort.
3. **GDPR + junior guardrails** — non-negotiable because real people's data
   (incl. minors) goes live. See risks.
4. **Nothing broken anywhere** — secondary pages inherit tokens, must not crash
   or look dead.
5. **Real data imported to prod**, spot-checked.

## Explicitly deferred past soft launch

Team logistics layer (story-engine wiring, availability, events) · PRO paywall ·
long-tail page redesigns (lists, compare) · light mode · holo→Remotion share ·
full "mot fältet" BK Rating engine (see decision).

## Day plan (buffer baked in — do not plan to day 16)

**Days 1–2 — Lock & start**
- You decide: junior policy · BK Rating v1 scope · invite cohort · scope confirm
- Claude starts: player-profile design reconciliation (mockup → PlayerClient)

**Days 3–6 — The spine**
- Player profile done on real data (showcase)
- Home feed redesigned
- Match detail redesigned (kill cyan glow, score hero, tonal surfaces)

**Days 7–9 — Launch readiness**
- Claim UX polish + licence-nr capture + documented manual approval
- GDPR/junior guardrails implemented + privacy page copy
- BK Rating v1 wired on real data (per decision)
- Tag PRO features with `requiresPro` (no active gating)

**Days 10–12 — Polish & cross-app sweep**
- Every other route: confirm token inheritance, mobile-test, fix breakage
- Team page minimum: token-inherited, read-only (no full logistics)

**Days 13–14 — Merge & stage**
- Merge redesign branch → `main` (NOT before the spine is solid)
- Import/refresh BITS data in prod; spot-check real profiles + ratings
- Full real-device pass

**Days 15–16 — Buffer + invite**
- Absorb overrun, then send invites

## Critical risks (honest)

1. **BK Rating data dependency** — full "mot fältet" needs dense per-session
   field data you won't have at launch. → ship a **simpler v1 rating** now
   (the existing `calcRating`/percentile), full engine as fast-follow. DECIDE.
2. **Junior/GDPR is a hard gate** — minors' data live + social features is a
   real landmine. Minimum guardrails are launch-blockers, not nice-to-haves.
3. **Protect `main`** — don't merge the redesign until the spine is solid (~d13).
4. **Scope discipline** — polish the spine, let the long tail inherit tokens.
   Resisting "redesign everything" is what makes 16 days possible.
5. **Manual claim approval** at invite scale — don't build licence automation now.

## Split of work

**Claude builds:** 3 spine redesigns · BK Rating v1 wiring · guardrail
implementation · PRO tagging · cross-app sweep · merge.

**You decide/do:** junior + BK v1 decisions · invite list · run BITS import to
prod · Supabase config · manual claim approvals · legal/privacy copy review ·
real-device testing & feedback · the actual inviting.
