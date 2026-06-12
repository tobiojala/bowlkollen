# Auto-Story Engine — Bowlkollen Team Page
**Version:** 1.0  
**Date:** 2026-06-08  
**Status:** Spec — not yet built

---

## The Core Idea

Every other sports platform puts the burden on the team: post your update, write your lineup, upload your photo. Most amateur teams never do it, so their pages go dead.

Bowlkollen flips this. **The team just plays. The platform tells the story.**

Scores sync from BITS. From that moment Bowlkollen knows everything it needs: who won, who scored the high game, whether it extended a streak, whether a player crossed a milestone. The Auto-Story Engine turns all of that into structured story events that power the team page feed — automatically, for every team, even if the captain never logs in.

The captain makes three optional taps per match week. Everything else runs itself.

---

## What the Engine Auto-Generates

| Trigger | Event created |
|---|---|
| Match result synced | `match_result` — result card with top scorer, narrative line |
| Win streak reaches 3, 5, 7, 10 | `win_streak` — streak milestone card |
| Unbeaten run reaches 4, 6, 8 | `unbeaten_run` — milestone card |
| Player top-scores their own career high | `personal_best` — player record card |
| Player plays 10th / 25th / 50th / 100th match | `player_milestone` — career milestone card |
| Player momentum crosses +5 delta threshold | `form_rising` — trending player card |
| Team moves up in division standings | `division_climbed` — league position card |
| Upcoming match < 48h away | `match_preview` — opponent spotlight card |
| Season halfway point (match 7 of 14 etc.) | `season_midpoint` — season snapshot card |
| Captain confirms lineup | `lineup_announced` — visual lineup card |
| Captain taps match hero | Updates the `match_result` event with featured player |
| Captain writes optional note | Adds `captain_note` to any event |

---

## The Captain's Three Taps

This is the full extent of what a captain needs to do to run their page:

**1. Lineup confirmation** (before each match)
Triggered by a push notification or in-app prompt:
> "Bekräfta truppen till lördag?"

Captain taps yes/no per player. Takes 2 minutes. The system then auto-creates a `lineup_announced` event as a visual card on the team page.

If the captain does nothing, the page still works — it just won't have a lineup card.

**2. Match hero** (after each match)
After a result syncs, captain sees a single prompt:
> "Vem var matchens hjälte?"

They tap one player node on the DNA helix. That player is featured on the `match_result` event card. If the captain does nothing within 24 hours, the system defaults to the player with the highest game in that match.

**3. Optional captain note** (any time)
140-character text field attached to any event. Not required. Adds the human voice on top of the auto-generated story.

> "Tuff match men laget kämpade sig igenom. Stolt."

---

## Data Model

### New table: `team_events`

The central table. One row per story moment.

```sql
CREATE TABLE team_events (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id             uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_type          text        NOT NULL,   -- see Event Types below
  title               text        NOT NULL,   -- auto-generated headline
  body                text,                   -- auto-generated narrative sentence
  payload             jsonb       NOT NULL DEFAULT '{}',  -- structured data for card rendering
  featured_player_id  uuid        REFERENCES players(id),
  match_id            uuid        REFERENCES matches(id),
  captain_note        text,                   -- optional 140-char captain comment
  is_pinned           boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate events for same trigger
  UNIQUE (team_id, event_type, match_id),
  UNIQUE (team_id, event_type, featured_player_id, created_at::date)
);

ALTER TABLE team_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read"  ON team_events FOR SELECT USING (true);
CREATE POLICY "admin write"  ON team_events FOR ALL USING (
  EXISTS (SELECT 1 FROM club_claims WHERE user_id = auth.uid() AND team_id = team_events.team_id)
);
```

### New table: `team_event_reactions`

Fan reactions on events (emoji, no text needed).

```sql
CREATE TABLE team_event_reactions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id     uuid NOT NULL REFERENCES team_events(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction     text NOT NULL,   -- 'fire' | 'heart' | 'clap' | 'sad'
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)    -- one reaction per user per event
);

ALTER TABLE team_event_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read"     ON team_event_reactions FOR SELECT USING (true);
CREATE POLICY "auth write"      ON team_event_reactions FOR ALL USING (auth.uid() IS NOT NULL);
```

### Extended: `team_events` payload shapes per event type

```typescript
// match_result
payload: {
  opponent_id:    string
  opponent_name:  string
  my_score:       number
  opp_score:      number
  is_home:        boolean
  division:       string
  top_scorer:     { player_id: string; name: string; high_game: number } | null
  result:         'W' | 'D' | 'L'
}

// win_streak | unbeaten_run
payload: {
  streak_length:  number
  previous_best:  number   // season best before this
  is_season_best: boolean
}

// personal_best
payload: {
  player_id:      string
  player_name:    string
  new_best:       number
  previous_best:  number
  match_id:       string
}

// player_milestone
payload: {
  player_id:      string
  player_name:    string
  milestone:      10 | 25 | 50 | 100
  total_matches:  number
}

// form_rising
payload: {
  player_id:      string
  player_name:    string
  delta:          number   // recentAvg - seasonAvg
  recent_avg:     number
  season_avg:     number
}

// division_climbed
payload: {
  new_position:   number
  old_position:   number
  total_teams:    number
  division:       string
  points:         number
}

// match_preview
payload: {
  opponent_id:    string
  opponent_name:  string
  match_date:     string   // ISO
  is_home:        boolean
  venue:          string | null
  h2h_wins:       number
  h2h_losses:     number
  h2h_draws:      number
  opponent_form:  ('W' | 'D' | 'L')[]  // last 5
}

// lineup_announced
payload: {
  match_id:        string
  match_date:      string
  opponent_name:   string
  is_home:         boolean
  players:         { id: string; name: string; position: number }[]
}

// captain_post (manual, no auto-generation)
payload: {
  text: string   // up to 280 chars — longer than captain_note
}
```

---

## Event Type Catalog

### `match_result`
**Trigger:** Match status changes to `completed` and scores are not null  
**Auto-title examples:**
- "Seger mot Göteborgs BK"
- "Förlust mot Mariestads BK"
- "Oavgjort mot IK Hakarpspojkarna"

**Auto-body examples:**
- "Vann med 24–18 hemma. Erik Svensson toppade med 245."
- "Förlorade med 18–22 borta. Tight match hela vägen."

**Card shows:** Opponent logo/initials, score (large), W/D/L badge, featured player if set, captain note  
**Captain action:** Tap match hero within 24h. System defaults to top game scorer.  

---

### `win_streak`
**Trigger:** Win streak reaches 3, 5, 7, or 10  
**Auto-title:** "5 raka vinster"  
**Auto-body:** "Säsongens bästa streak. Bästa formen sedan [date of last streak this long]."  
**Card shows:** Number (very large), flame visual, streak history dots  
**Deduplicate:** Only create once per streak milestone per season  

---

### `unbeaten_run`
**Trigger:** Unbeaten run (no losses) reaches 4, 6, 8, 10  
**Auto-title:** "6 matcher utan förlust"  
**Auto-body:** "Har inte förlorat sedan [date of last loss]."  

---

### `personal_best`
**Trigger:** A player in a team match scores higher than their previous career best (from `match_results`)  
**Auto-title:** "Erik Svensson: nytt karriärrekord"  
**Auto-body:** "Slog 267 — 12 pins bättre än förra bästa."  
**Card shows:** Player initials, new score (gold, large), previous best, match context  

---

### `player_milestone`
**Trigger:** Player's total `match_results` count crosses 10, 25, 50, 100  
**Auto-title:** "Erik Svenssons 50:e match"  
**Auto-body:** "Matchade i sin 50:e tävlingsmatch för laget."  
**Card shows:** Player, milestone number, total stats summary  

---

### `form_rising`
**Trigger:** Player's recent 3-match avg exceeds season avg by ≥ 8 pins (higher threshold than the DNA hue change at +5)  
**Auto-title:** "Erik Svensson i toppform"  
**Auto-body:** "+18 pins jämfört med säsongssnitt de senaste 3 matcherna."  
**Deduplicate:** Only once per player per week  

---

### `division_climbed`
**Trigger:** Team's computed division position improves by ≥ 1 place after a result syncs  
**Auto-title:** "Klättrade till 3:e plats"  
**Auto-body:** "Går om Göteborgs BK i tabellen. 2 poäng från topp-2."  

---

### `match_preview`
**Trigger:** Upcoming match is < 48h away (computed at page-load time, not persisted — or persisted at 48h boundary)  
**Auto-title:** "Derby mot Mariestads BK på lördag"  
**Auto-body:** "Inbördes: 3 vinster, 1 förlust. Hemmaplan."  
**Card shows:** Opponent, H2H record, match day + time, is_home badge, countdown  

---

### `lineup_announced`
**Trigger:** Captain confirms availability and taps "Publicera truppen"  
**Auto-title:** "Truppen mot Mariestads BK"  
**Card shows:** Visual lineup — player names in bowling order (bord 1-4 etc.), match context  

---

### `captain_post`
**Trigger:** Manual. Captain writes up to 280 chars.  
**No auto-generation.** This is the captain's human voice.  
**Card shows:** Captain avatar/initials, text, timestamp  
**This is the only event type that is 100% manually created.**  

---

## Generation Logic — MVP Approach

For the first version, we avoid real-time webhooks and use a **page-load sync** pattern:

```
1. Team page loads → call syncTeamEvents(teamId)
2. syncTeamEvents reads:
   - All completed matches for the team (current season)
   - All match_results for team players
   - Current standings position
3. For each potential event, check if it already exists in team_events
   (matched on team_id + event_type + match_id or created_at::date)
4. If missing and trigger condition met → INSERT new event
5. Function is idempotent — safe to call on every page load
6. Max 10 new events per call to avoid thundering herd on first load
```

**Later (Phase 2):** Supabase Edge Function triggered by database webhook on `matches` table update. True real-time. For now, page-load sync is sufficient.

---

## The Team Feed (renders on the team page)

Replaces the current `TeamCommunity` section entirely.

**Feed structure:**
```
[Pinned event — latest match_result or win_streak]

[Timeline, newest first:]
  match_preview (if < 48h)
  match_result (last match)
  personal_best (if any this week)
  win_streak (if milestone hit)
  form_rising (if any player)
  captain_post (any manual posts)
  player_milestone (if any this season)
  division_climbed (if happened)
  ...
```

**Each card in the feed:**
- Auto-generated title + body
- Relevant visual (score, player, streak number)
- Captain note if added (shown below auto-content)
- Reaction strip: fire / heart / clap / 😞 (fans react, count shown)
- Timestamp

**Captain admin overlay (only visible to admins):**
- On `match_result` events: "Utse matchhjälte" button (one tap)
- On any event: "Lägg till kommentar" (140 chars)
- Option to pin/unpin one event
- Option to hide an event (soft delete)

---

## The Captain Dashboard (minimal, integrated)

Not a separate page — just a small section visible to logged-in admins at the top of the feed:

```
┌─────────────────────────────────────────┐
│  KAPTENENS ÅTGÄRDER                     │
│                                         │
│  [Bekräfta truppen →]   (if match <72h) │
│  [Utse matchhjälte →]   (if result new) │
│  [Skriv en kommentar]                   │
└─────────────────────────────────────────┘
```

Three buttons, max. Not a dashboard. The platform does everything else.

---

## Fan Interactions (Phase 2)

Not blocking Phase 1 but designed now:

### Predictions
Before each `match_preview` event, fans can tap one of three outcomes: Vinst / Oavgjort / Förlust  
After the match: prediction accuracy shown on their profile  
Teams see aggregate fan confidence ("67% av fans tror på vinst")

### Player cheers
On the DNA helix, logged-in fans can "cheer" a player  
The node gets a warm outer glow for 24h  
Count: "12 fans heja på Erik"

### Follow-based notifications (future)
Fans who follow a team get notified when:
- A match result is posted
- A win streak milestone hit
- Captain posts something
- Lineup announced

---

## Phase Rollout

### Phase 1 — Auto-Story Engine core (build now)
- [ ] Create `team_events` table + RLS policies
- [ ] Create `team_event_reactions` table + RLS policies
- [ ] Write `syncTeamEvents(teamId)` Supabase function (page-load sync)
  - Handles: `match_result`, `win_streak`, `personal_best`, `player_milestone`, `form_rising`
- [ ] Build `TeamFeed` component — renders event cards
  - `MatchResultCard` — score, opponent, hero player
  - `StreakCard` — number, milestone
  - `PersonalBestCard` — player, score
  - `MilestoneCard` — player, milestone
  - `FormRisingCard` — player, delta
- [ ] Captain "match hero" tap on DNA → updates event
- [ ] Captain note field on events
- [ ] Replace `TeamCommunity` with `TeamFeed`

### Phase 2 — Match cycle + preview (next sprint)
- [ ] `match_preview` event (< 48h trigger)
- [ ] `lineup_announced` event
- [ ] `division_climbed` event
- [ ] Match day mode (page transforms on match day)
- [ ] Captain dashboard panel (3 action buttons)

### Phase 3 — Fan engagement
- [ ] `team_event_reactions` — emoji reactions on feed cards
- [ ] Pre-match predictions
- [ ] Player cheers on DNA
- [ ] Follow-based notifications

---

## Open Questions

1. **Score sync timing** — Does Bowlkollen receive BITS scores in real-time or with a delay? This affects whether Phase 2 Edge Functions are needed immediately or page-load sync covers it.

2. **Personal best scope** — Career best across all teams, or per-team best? Career best is more meaningful but requires querying across all match_results for a player.

3. **Standings computation** — Division position is currently computed client-side in `TeamTableWidget`. To generate `division_climbed` events accurately, we need this computed server-side and stored. Spec this separately.

4. **Captain verification** — Who is the captain? Currently `club_claims` marks a user as admin for a team. Is one admin designated as "captain" or do all admins share the role? The "captain note" voice assumes one person.

5. **Captain posts vs. auto events** — Should captain manual posts live in `team_events` (type `captain_post`) or stay in the existing `team_posts` table? Recommendation: migrate to `team_events` for unified feed, deprecate `team_posts`.

6. **Event expiry** — Should old events (> 1 season) be archived or shown indefinitely? Suggest: show current season only by default, archive older seasons accessible via "Arkiv" tab.

7. **Privacy** — Are all events public? Current spec assumes yes (public read RLS). Should teams be able to make their page private (members only)?

---

## Summary: What This Replaces

| Current | Replaced by |
|---|---|
| `TeamCommunity` — manual text posts | `TeamFeed` — auto-generated event cards + optional captain notes |
| `TeamPulse` — stat chips | First event card in feed (match_result or match_preview) |
| `TeamOverview` story cards | Events in the feed are the story |
| Admin edit panel community section | Captain dashboard (3 taps) |

The `team_posts` table is deprecated in favour of `team_events` with `event_type = 'captain_post'`.
