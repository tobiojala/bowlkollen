# Account model — fans, players, teams (web + native, identical)

Approved 2026-08-19. Goal: welcome **fans & family** with zero friction, while
**minimising fake users** by gating real-player identity behind vouching. The
procedure and security are **identical on web and native** (same RPCs, same UI
steps, shared logic in `@bowlkollen/core` where pure).

## The three tiers

| Tier | How you get it | Can do | Cannot do |
|---|---|---|---|
| **1 · Fan / Family** | Just sign up (no licence) | Follow players/teams, home feed + stories, competitions, standings, discover, halls, klotshopar, react/save | Claim a player, join a team's private tools |
| **2 · Verified Player** | Claim → verified (see below) | Everything a fan can + own stats, diary, prep, "my profile", availability | Captain-only team admin |
| **3 · Team member / Captain** | Verified player + team join (see below) | Team private tools: availability, lineup, anslagstavla; captain = admin | — |

Fans are **safe by design**: an account can't impersonate anyone — *claiming a
player* is the gated act, not having an account. So fan signup stays open.

## Onboarding — two-door welcome (both apps)
First screen asks intent:
- **"Jag följer bowling"** (fan/familj) → follow teams/players → home. Done.
- **"Jag är spelare"** → follow → then the claim flow (Tier 2).

Either door lands in a working app; the player door additionally offers the claim.

## Verification — code primary, licence → pending (the anti-fake gate)
Identical on both apps. Becoming a **Verified Player** or **joining a team**:

- **Lane 1 — Invite code (primary, instant).** A code from a verified
  teammate/captain = a vouch → instant membership. RPC: `redeem_team_invite`
  (exists; `team_invite_redemption.sql`). Web must add the UI; native has it.
- **Lane 2 — Licence only → PENDING.** No code → entering a licence creates a
  **pending** request approved by a captain (peer vouch) or admin. **Never
  instant — even when the licence matches the official BITS roster** (a matched
  licence proves the licence is on the team, not that *you* are that person).
- **Lane 3 — BankID (future).** Proves identity → safe instant self-verify for
  the "no code, no captain online" case. Not in this milestone.

Guardrails (AGENTS.md security rules 3–5): role (captain) is **never**
auto-granted — only by an existing captain/admin; every grant runs through a
`SECURITY DEFINER` RPC that re-checks the caller; codes are time-limited,
use-capped, revocable, attributed.

## Build checklist (piece by piece; keep this list current)
- [x] **Native onboarding:** two-door welcome (`components/WelcomeChooser.tsx`).
- [x] **Web onboarding:** two-door welcome (matches native).
- [x] **Security core (DB):** `account_verification_hardening.sql` — `submit_team_claim`
      verified only via a vouch (code); `submit_player_claim` + licence-only → pending.
      Reverses `claim_license_verification.sql`. **⚠ Run in Supabase after review.**
- [x] **Both apps' join UI:** optional invite-code field (vouch = instant); licence-only
      reworded to "granskas först" (web ClaimTeamSheet, native ga-med). This is also the
      web in-team join-via-code (closes PARITY gap 3a).
- [ ] **Follow-up:** derive a verified *player_claim* from a vouched, roster-matched
      *team_claim* (`matched_public_id`), so the code path gives instant player
      verification too — otherwise a licence-only player claim waits for admin review.
- [ ] Later: BankID (Lane 3).

## ⚠ Open decision — player verification without a code
With the hardening, a player who claims by **licence alone** is now PENDING until a
captain/admin approves (no instant self-verify). Instant verification comes from a
team **invite code**. If waiting-on-admin is too much friction, do the follow-up above
(code+roster-match → instant player verify) or bring BankID forward.

See [[project_standards_and_parity]] and PARITY.md (Worlds 2/3).
