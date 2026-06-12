---
name: dna-helix-roadmap
description: DNA helix squad visualization — features built and deferred upgrade list
metadata:
  type: project
---

DNA helix is live in TeamSquad.tsx. Each player node is a clickable strand on an animated SVG double helix colored by team hue.

**Built (phase 1–3):**
- Two animated strand paths draw in on load, then breathe with continuous opacity pulse
- Player nodes spring in after strands, each colored by player name hue
- Crown badge (★) on top avg scorer, Fire badge (▲) on most-matches player (if different)
- Tap-card: tap any node → mini card slides up with full name, avg/best/matches stats, "Profil →" CTA

**Deferred upgrades (phase 4–5):**

4. **Fan favorites** — logged-in users tap-hold a node to claim their favourite player. Node gets a warm outer glow. Shows "X fans follow [name]" count under the node. Needs: `player_fans` table (player_id, user_id).

5. **Match-day mode** — on match day, lineup players' nodes glow brighter and pulse faster; others dim. Connects DNA view to live match. Needs: lineup data from `laguttagning` flow and date comparison.

**How to apply:** When the user asks to continue DNA helix work, start with fan favorites (needs DB table first), then match-day mode.
