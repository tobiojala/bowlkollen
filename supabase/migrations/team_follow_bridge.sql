-- Team-follow bridge. FollowButton on the legacy team page wrote
-- entity_id = teams.id (a legacy uuid) — that table has zero connection to
-- bits_teams/bits_matches, so a team-follow from there could never power
-- anything real. Onboarding's TeamPicker already does this correctly
-- (writes bits_team_id) — this brings the legacy team page in line with
-- that, by resolving at follow-time rather than migrating anything (zero
-- existing 'team' follows exist to migrate, confirmed live).
--
-- resolve_bits_team_id() reuses the same exact-or-substring name-match
-- convention already shipped in src/app/clubs/[bitsId]/page.tsx's
-- findOurTeam() (club-scoped here for safety, since this isn't running in
-- a single-club page context) — not a stricter new rule, and deliberately
-- not persisted anywhere. A full confident bulk migration is the
-- separately-deferred Supabase cleanup project, not this.

CREATE OR REPLACE FUNCTION resolve_bits_team_id(p_legacy_team_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bt.bits_team_id
  FROM teams t
  JOIN bits_teams bt ON (
    lower(bt.club_name) = lower(t.club)
    AND (
      lower(bt.name) = lower(t.name)
      OR lower(bt.name) LIKE '%' || lower(t.name) || '%'
      OR lower(t.name) LIKE '%' || lower(bt.name) || '%'
    )
  )
  WHERE t.id = p_legacy_team_id
  -- Closest name length wins, not shortest — "AIK BK H A" should match
  -- "AIK BK H" (the specific men's team), not the bare "AIK BK" entry
  -- that also substring-matches but is actually less specific. Genuine
  -- duplicates (e.g. two identical "Bodens BS" rows in bits_teams, a known
  -- sync artifact) fall back to the lowest id, just for a stable, repeatable
  -- pick rather than depending on physical row order.
  ORDER BY abs(length(bt.name) - length(t.name)) ASC, bt.bits_team_id ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION resolve_bits_team_id(uuid) TO anon, authenticated;

-- ─── get_user_season_matches: add followed-teams branch ───────────────────
CREATE OR REPLACE FUNCTION get_user_season_matches()
RETURNS TABLE (
  bits_match_id   integer,
  match_date      date,
  round_id        integer,
  home_team_name  text,
  away_team_name  text,
  home_score      integer,
  away_score      integer,
  division_name   text,
  is_finished     boolean,
  hall_name       text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_divisions AS (
    SELECT DISTINCT bm.bits_division_id
    FROM follows f
    JOIN bits_players bp ON bp.public_id = f.entity_id::uuid
    JOIN bits_match_player_results bmpr ON bmpr.lic_nbr = bp.lic_nbr
    JOIN bits_matches bm ON bm.bits_match_id = bmpr.bits_match_id
    WHERE f.user_id = auth.uid() AND f.entity_type = 'player'
    UNION
    SELECT DISTINCT bm.bits_division_id
    FROM player_claims pc
    JOIN bits_players bp ON bp.public_id = pc.player_id
    JOIN bits_match_player_results bmpr ON bmpr.lic_nbr = bp.lic_nbr
    JOIN bits_matches bm ON bm.bits_match_id = bmpr.bits_match_id
    WHERE pc.user_id = auth.uid() AND pc.status = 'verified'
    UNION
    SELECT DISTINCT bm.bits_division_id
    FROM follows f
    JOIN bits_matches bm ON (
      bm.home_bits_team_id::text = f.entity_id OR bm.away_bits_team_id::text = f.entity_id
    )
    WHERE f.user_id = auth.uid() AND f.entity_type = 'team'
  )
  SELECT bm.bits_match_id, bm.match_date, bm.round_id, bm.home_team_name, bm.away_team_name,
         bm.home_score, bm.away_score, bm.division_name, bm.is_finished, bm.hall_name
  FROM bits_matches bm
  WHERE bm.bits_division_id IN (SELECT bits_division_id FROM my_divisions)
  ORDER BY bm.match_date;
$$;

GRANT EXECUTE ON FUNCTION get_user_season_matches() TO anon, authenticated;
