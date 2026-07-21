# Bowlkollen — Product Direction Reset (2026-07)

## Context for Claude

This document summarizes an important product discussion that fundamentally changed how we think about Bowlkollen.

## Why this discussion happened

I started thinking about rebuilding Bowlkollen as a native mobile app instead of continuing to build primarily for the web.

The concern was that I had spent a long time building a Next.js web application and was worried that all of that work had been "wasted."

The conclusion was:

The backend, business logic, database, data models, and product knowledge are extremely valuable and should be preserved.

The UI should evolve into a native mobile experience (Expo + React Native), but the intelligence of Bowlkollen should remain.

This is NOT a "start over."

It is a product evolution.

## The biggest realization

For months I have been building features.

Every feature was something I personally wanted as a bowler.

The problem was that I never truly understood how all of those features connected into one product.

This conversation finally answered that question.

## Bowlkollen is NOT...

Not another BITS.

Not another Svenskalag.

Not another statistics website.

Not another feature collection.

## Bowlkollen IS...

The home of a bowler's entire bowling life.

Everything should support this idea.

A bowler should be able to manage, experience, improve and remember their entire bowling career inside one application.

## Competitor Reflection

I recently discovered Bowlat (www.bowlat.se) — already launched.

It is a strong product. It already contains:

- Statistics
- Match pages
- Player pages
- Team pages
- Historical data
- Comparisons
- Following
- Personal score tracking

The conclusion was NOT to copy Bowlat. Instead we identified the difference.

Bowlat owns information. BITS owns official competition data. **Bowlkollen should own the bowler's experience.**

That changes everything.

## The Product Shift

Instead of asking:

"What feature should we build?"

We now ask:

"What part of a bowler's life are we helping with?"

Everything fits into four major moments — see PRODUCT_CONSTITUTION.md for the full Four Pillars / Five Worlds breakdown.

## The Real Competitive Advantage

BITS knows: "My official results."

Bowlkollen knows: "My bowling life."

That means Bowlkollen stores things no official database can:

- Ball arsenal
- Surface changes
- Favorite layouts
- Bowling center notes
- Oil pattern experiences
- Personal reminders
- Team communication
- Practice history
- Saved matches
- Goals
- Memories

Official data + personal data together create something unique.

## Team & Identity

One of the strongest ideas discussed was verified identities.

Flow:

Player claims profile → Official BITS identity → Joins official team → Captain verifies → Automatically connected with teammates → Notifications → Match history → Season history → Career history

This creates a real community rather than anonymous statistics.

## Partnerships

Future integrations make Bowlkollen much stronger.

Potential ecosystem: BITS (official match data) → Bowlkollen (Season Atlas, BK Rating, Auto Stories, player memories, followers, captain tools, competition experience).

Potential integrations include Bowlres and BowlIT where appropriate.

The goal is not to replace existing systems. The goal is to connect them into one seamless player experience.

## Mobile First

A major decision from this discussion: **Bowlkollen should become a native mobile app.**

The phone is where bowlers actually interact with the sport.

The website still has value:

- Public profiles
- SEO
- Marketing
- Shareable links
- Administration

But the primary product experience should be mobile.

## Development Philosophy

We should stop building isolated features. Instead we build connected systems. Everything should strengthen the ecosystem.

Examples:

Saved Games connects to: Season Atlas, Statistics, AI, Equipment, Notes.

Competitions connect to: Live scoring, Stories, Notifications, Team pages, Player history.

Nothing should feel isolated.

## Working Rules for Claude

When implementing new features:

1. Challenge ideas that don't support the product vision.
2. Don't build features just because competitors have them.
3. Prefer one deeply integrated feature over five disconnected ones.
4. Keep asking: "How does this strengthen the bowler's experience?"
5. Think in systems, not pages.
6. Build mobile-first.
7. Keep the architecture modular and easy to understand.
8. Protect the long-term vision over short-term feature count.

## Final Direction

The most important sentence from this discussion:

Bowlkollen is not trying to become the best bowling statistics website.

Bowlkollen is becoming the home of a bowler's entire bowling life.

Every design decision, feature, architecture change and future roadmap should support that mission.

---

*Companion document to PRODUCT_CONSTITUTION.md — that file tells Claude what Bowlkollen is; this one tells Claude how we arrived there.*
