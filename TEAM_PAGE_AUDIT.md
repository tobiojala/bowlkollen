# Team Page Audit — Bowlkollen
**Date:** 2026-06-08  
**Route:** `/teams/[id]` → `src/app/teams/[id]/`  
**Stack:** Next.js 16 App Router · React Query · Supabase · Framer Motion v12 · SVG

---

## Architecture

### Data flow
```
page.tsx  (Server Component, ISR revalidate 300s)
  └─ prefetches team + matches via createPublicSupabase() (cookie-free, ISR-safe)
  └─ HydrationBoundary
       └─ TeamClient.tsx  ('use client', data orchestrator)
            ├─ useTeam(id)          — React Query, pre-hydrated
            ├─ useTeamMatches(id)   — React Query, pre-hydrated
            ├─ useSession()         — auth state
            └─ useEffect fetches:   players, playerStats, posts, isAdmin,
                                    clubLogoUrl, clubTeams, sponsors (local state)
```

### File structure
```
src/app/teams/[id]/
├── page.tsx                    Server shell + prefetch (44 lines)
├── loading.tsx                 Route-level loading state
├── error.tsx                   Route-level error boundary
└── _components/
    ├── TeamClient.tsx          Data orchestrator, admin edit panel (237 lines)
    ├── TeamHero.tsx            Full-width gradient hero section (182 lines)
    ├── TeamSectionNav.tsx      Sticky section nav, IntersectionObserver (76 lines)
    ├── TeamOverview.tsx        Översikt section wrapper (47 lines)
    ├── TeamSquad.tsx           DNA helix squad visualization (260 lines)
    ├── TeamMatches.tsx         Matcher section, pill toggle, H2H (196 lines)
    ├── TeamCommunity.tsx       News feed + admin post composer (128 lines)
    ├── TeamSponsors.tsx        Sponsor showcase + Bli sponsor pitch (164 lines)
    └── TeamSponsorAdmin.tsx    Admin add/remove sponsors panel (134 lines)
```

---

## Component-by-component breakdown

### TeamClient.tsx — data orchestrator
- Fetches players, playerStats, posts, isAdmin, clubLogoUrl, clubTeams via `useEffect`
- Holds local state for sponsors + acceptingSponsors (pending DB wiring)
- Renders admin edit panel (team fields: description, city, home_hall, email, phone, website, instagram, facebook)
- Renders all section components in order
- Loading skeleton (pulse animation)
- Error state with retry button

### TeamHero.tsx — full-width hero
- Full-width gradient derived from team name hue: `hsl(${hue}, 52%, 16%)` dark / `hsl(${hue}, 44%, 79%)` light
- Back nav (← Alla lag) + Share button (copies slug URL) + admin Edit button
- Club logo (88px, rounded-22) with fallback to team initials
- Team name (30px, bold), division badge + city + home hall
- Description/tagline in italic
- Social links: website, instagram, contact email
- CTAs: FollowButton + "Lagets sida →" (if session) + "Jämför"
- Club sibling teams pill-row
- **Frosted-glass stats strip** at bottom: Spelade / Vunna / Oavgjorda / Förlorade / Poäng + last-5 form pills
- Admin edit panel slides in below hero (toggles via onEditClick prop)

### TeamSectionNav.tsx — sticky navigation
- `position: sticky; top: 0; z-index: 50`
- Frosted glass: `backdrop-filter: blur(14px)`
- 4 sections always: Översikt, Trupp, Matcher, Community
- 5th section (Sponsorer) shown only when `showSponsors` prop is true
- `IntersectionObserver` on each section ID to track active section
- Active indicator: 2.5px bottom border in team hue color
- Section IDs: `team-overview`, `team-squad`, `team-matches`, `team-community`, `team-sponsors`
- Each section uses `scrollMarginTop: 60` to account for sticky nav height

### TeamOverview.tsx — Översikt section
- Section anchor: `id="team-overview"`
- Renders: NextMatchPreview (if upcoming matches exist)
- Renders: TeamTableWidget (if division known)
- Renders: TopPerformers
- Renders: SeasonTimeline
- All widgets are pre-existing components, TeamOverview is a thin wrapper

### TeamSquad.tsx — DNA helix (260 lines)
**This is the centerpiece of the redesign.**

#### Visual structure
- SVG double helix: two opposing sine-wave S-curves
- Strand A (primary): top-bottom-top alternating, team hue color, strokeWidth 3.5
- Strand B (complement): opposite phase, dimmer, strokeWidth 2.5
- Crossing-point dots: small circles at the X-crossing midpoints between nodes
- Player nodes: circles (r=22) alternating top/bottom positions on the helix
- Labels: first name above top nodes, below bottom nodes; avg score outermost

#### Animation (framer-motion v12 compatible)
- **Strands**: CSS `@keyframes` injected via `<style>` tag (NOT framer-motion — pathLength + useAnimation broke in v12)
  - `helix-a`: 3.2s loop — fades in (0→1 in first 20%), then breathes (1↔0.58)
  - `helix-b`: 3.8s loop — fades in (0→0.55 in first 18%), then breathes (0.55↔0.20)
- **Nodes**: `motion.g` with `scale` (transformBox: fill-box) — springs in with delay `0.4 + i * 0.07s`
- **Labels**: `motion.text` opacity fade after node delay
- **Badges**: `motion.g` scale spring after node delay + 0.4s

#### Badges
- **★ Crown** (gold `#f5c200`): player with highest avg — positioned top-right of node
- **▲ Fire** (orange `#ff6b2b`): player with most matches (if different from crown holder)

#### Tap-card (mobile-first interaction)
- Tap node → `activeId` state set
- `AnimatePresence` card springs up below SVG
- Card shows: initials, full name, badge label (if any), avg/best/matches stats
- "Profil →" button navigates to `/players/[id]`
- Tap same node again = dismiss, tap another node = swap card

#### Node click behavior
- Click = show/hide tap-card (no immediate navigation)
- Navigation only via "Profil →" in the tap-card
- Desktop hover: active ring expands around node

### TeamMatches.tsx — Matcher section
- Pill toggle: Resultat / Kommande / H2H (not tabs — pills)
- **Default: shows 5 results** with "X fler matcher ↓" expand button
- Expand toggles `showAll` state — shows all, then "↑ Visa färre"
- Match rows: result badge (V/F/O), opponent logo (initials), score, home/away, division badge
- H2H: collapsible per-opponent with win/draw/loss record + "Jämför →" link
- H2H rows expand with `motion.div` height animation
- `showAll` state resets per-tab (switching tabs collapses the list)

### TeamCommunity.tsx — Community section
- Public news feed visible to all
- Admin only: post composer with type toggle (Nyhet / Laguttagning)
- Post cards with type badge (green = Nyhet, accent = Laguttagning), timestamp, content
- Admin can delete posts
- "Inga inlägg än" empty state differentiates admin vs. visitor message

### TeamSponsors.tsx — Sponsor section
- Only renders if `sponsors.length > 0` OR `acceptingSponsors === true`
- Adaptive tier rendering — only shows tiers that have sponsors:
  - **Huvud** (1 max): full-width card, large logo, tagline, "Besök webbplats" button. Gold border.
  - **Guld**: 2-column grid, medium logo + name + web link
  - **Silver**: 3-column grid, small logo + name
  - **Partner**: horizontal pill row, logo + name
- **"Bli vår sponsor" pitch section** (shows when `acceptingSponsors` is true):
  - 3-column tier benefits table (Guld / Silver / Partner)
  - Pre-filled mailto CTA: `mailto:${contactEmail}?subject=Sponsorförfrågan – ${teamName}`
  - If no contact_email set: shows instruction to add one
- Logo fallback: first letter of sponsor name if logo URL fails

### TeamSponsorAdmin.tsx — Admin sponsor management
- Rendered inside TeamClient when `editingTeam && isAdmin`
- "Söker sponsorer" toggle (pill switch) — flips acceptingSponsors state
- Sponsor list: name + tier label + trash button per entry
- "Lägg till sponsor" button opens inline form:
  - Fields: Namn (required), Nivå (select: Huvud/Guld/Silver/Partner), Webbplats, Logo-URL, Tagline
  - Add / Avbryt buttons
- All changes are local state only (pending DB wiring)

---

## Utility functions used (src/lib/utils.ts)

| Function | Purpose |
|---|---|
| `shortName(n)` | Strips suffixes (A, H A, DA, F) from team names |
| `teamInitials(n)` | Returns 2-3 uppercase initials from team name |
| `teamColor(name, isDark)` | Returns `{ bg, border, text }` hue-derived colors |
| `shortDiv(d)` | Abbreviates division names for compact display |
| `divisionColor(d)` | Returns accent color per division tier |

---

## Database state

### Fully wired to Supabase
| Table | Used for |
|---|---|
| `teams` | Team profile, admin edit saves here |
| `matches` | Results, upcoming, H2H |
| `players` | Squad roster |
| `match_results` | Player stats (avg, high, matches) |
| `team_posts` | Community feed (read + write) |
| `club_claims` | Admin check (user owns team) |
| `bits_clubs` | Club logo URL |

### Local state only — needs DB migration
| Feature | State | Migration needed |
|---|---|---|
| Sponsors | `useState<Sponsor[]>([])` | See SQL below |
| acceptingSponsors | `useState(false)` | Column on `teams` table |

### SQL migration for sponsors
```sql
CREATE TABLE team_sponsors (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id       uuid REFERENCES teams(id) ON DELETE CASCADE,
  name          text NOT NULL,
  logo_url      text,
  website       text,
  tagline       text,
  tier          text NOT NULL DEFAULT 'partner', -- 'main' | 'gold' | 'silver' | 'partner'
  display_order int  DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE team_sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read"  ON team_sponsors FOR SELECT USING (true);
CREATE POLICY "admin write"  ON team_sponsors FOR ALL USING (
  EXISTS (SELECT 1 FROM club_claims WHERE user_id = auth.uid() AND team_id = team_sponsors.team_id)
);

-- Also add to teams table:
ALTER TABLE teams ADD COLUMN IF NOT EXISTS accepting_sponsors boolean DEFAULT false;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS cover_photo_url   text;
```

---

## Types added (src/lib/types.ts)

```typescript
export type SponsorTier = 'main' | 'gold' | 'silver' | 'partner'

export type Sponsor = {
  id:            string
  team_id:       string
  name:          string
  logo_url:      string | null
  website:       string | null
  tagline:       string | null
  tier:          SponsorTier
  display_order: number
}
```

---

## Known framer-motion v12 incompatibilities

| What broke | Why | Fix applied |
|---|---|---|
| `useAnimation()` + `pathLength` on SVG paths | v12 changed controls + SVG attribute animation internally | Replaced with CSS `@keyframes` in `<style>` tag |
| `motion.circle` with `initial={{ r: 0 }}` | SVG `r` attribute not reliably animated in v12 | Replaced with `motion.g` + CSS `scale` + `transformBox: fill-box` |

---

## Deferred features (planned, not built)

### Phase 4 — Fan favorites
- Logged-in fans tap-hold a player node → "claim" that player as favourite
- Node gets a warm outer glow
- Shows "X fans follow [name]" count under node
- Needs: `player_fans` table (player_id, user_id)

### Phase 5 — Match day mode  
- Within 24h of upcoming match: hero shows countdown, lineup nodes pulse faster, bench dims
- Connects DNA helix to live match experience
- Needs: lineup data from `laguttagning` flow + date comparison logic

### Cover photo
- Admin pastes a URL → full-bleed hero photo with dark overlay
- Needs: `cover_photo_url` column on `teams` (included in migration above)
- ~40 lines of code change in TeamHero.tsx

### Wire sponsors to DB
- Swap local `useState` for Supabase read/write
- ~30 lines of code change in TeamClient.tsx
- Blocked on: running the SQL migration above

---

## Performance notes
- Page uses ISR (`revalidate = 300`) — team + matches data cached for 5 minutes
- React Query hydrated from server — zero client waterfalls for core data
- Players, stats, posts, admin check fetched client-side in parallel via `Promise.all`
- SVG helix is fully static after mount — no re-renders from data changes
- DNA helix animation is CSS-only for strands (no JS animation loop)
