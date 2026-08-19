# Identity verification — research (BankID & international players)

Context: the account model (docs/ACCOUNT_MODEL.md) verifies players via **invite
code (vouch)** or **captain/admin review**. Lane 3 is an *instant self-verify with
no code*. BankID is the obvious Swedish answer — but we have international players,
so this note maps the whole space before we commit.

## The real task
Verify that the person IS who they claim, then **bind them to the right BITS
player** (licence ↔ real identity). BITS licence numbers encode name + birthdate
(e.g. `M271208ERI01` → born 27 Dec 2008) — that's the bridge: match a verified
real identity's **name + birthdate** to the licence, then verify the claim.

## Options, by reach

**1. Swedish BankID** — ~99% of Swedish adults, strongest trust, instant.
- Covers the large majority of our users.
- ✗ Swedish personnummer only → excludes non-Swedish players; some juniors lack it.
- Integrated via an aggregator/provider (below), not directly. Per-verify cost.
- GDPR: personnummer is sensitive — use it transiently to match, **store only a
  pseudonymous subject id**, never the raw number.

**2. Nordic eIDs** (Norwegian BankID, Danish MitID, Finnish FTN) — via the same
aggregators, one integration covers all of them. Covers Nordic imports (common in
Elitserien) instantly.

**3. Document verification** (passport / national ID + selfie liveness) — the only
*global* option; works for any nationality.
- Providers: Veriff, Onfido, Stripe Identity, Persona.
- ~1–2 EUR/check, a few seconds of user effort. Bind by matching document
  name + birthdate to the licence.

**4. eIDAS / EU Digital Identity Wallet** — coming (2026+), will standardise EU
eIDs. Watch, don't build on yet.

## Providers (aggregators that give Sweden + Nordic in one integration)
Criipto, Signicat, Scrive, Svensk e-identitet, ZignSec (ZignSec + Veriff-style also
cover documents). One contract → Swedish BankID + Norwegian/Danish/Finnish eID +
(some) document flows, on web and native (redirect/app-switch flows).

## Recommendation — phased
- **Phase 1 (now, shipped):** code-vouch + captain/admin review. No new vendor.
  This already covers everyone safely; internationals use vouch/admin.
- **Phase 2 (highest ROI):** Swedish BankID via an aggregator that also yields the
  other Nordic eIDs. Auto-verify by matching the eID's name + birthdate to the BITS
  licence. Covers the vast majority instantly; store only a pseudonymous subject id.
- **Phase 3 (optional):** document verification (Veriff/Onfido/Stripe Identity) for
  non-Nordic internationals — or leave them on vouch/admin (they're few).

## Open questions for us
1. Volume of non-Swedish players we actually need to self-verify? (Sizes Phase 3.)
2. Budget per verification (BankID via aggregator vs document check)?
3. GDPR/DPA: confirm we never persist personnummer; store provider subject id only.
4. Juniors: BankID or not, juniors stay on manual review (guardrail unchanged).
5. Pick one aggregator to trial (Criipto and Signicat are the usual shortlist).

Relates to docs/ACCOUNT_MODEL.md, memory `project_claim_identity_hardening`.
