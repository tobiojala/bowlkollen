-- Query helpers behind the onboarding follow-suggestion flow. Composition
-- (tagging tiers, ordering, dedup across calls) happens in TypeScript
-- (useOnboardingSuggestions in src/lib/queries.ts) — these stay simple,
-- single-purpose, and reusable, mirroring how bitsRowsToProfileMatches
-- composes over plain RPC rows rather than one giant SQL function.
--
-- "This season" is hardcoded to SEASON.CURRENT from src/lib/constants.ts
-- ('2025-07-01') — keep these two in sync if the season boundary changes.

-- ─── team_current_division ────────────────────────────────────────────────
-- A team's most-played division this season (by match count — handles the
-- rare mid-season division_name correction in the sync without extra logic).
CREATE OR REPLACE FUNCTION team_current_division(p_bits_team_id integer)
RETURNS TABLE (bits_division_id integer, division_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bm.bits_division_id, bm.division_name
  FROM bits_matches bm
  WHERE (bm.home_bits_team_id = p_bits_team_id OR bm.away_bits_team_id = p_bits_team_id)
    AND bm.match_date >= '2025-07-01'
  GROUP BY bm.bits_division_id, bm.division_name
  ORDER BY count(*) DESC
  LIMIT 1;
$$;

-- ─── get_team_roster ───────────────────────────────────────────────────────
-- Top players currently on a team this season, ranked by appearances then
-- average. Reused for all three player-suggestion tiers (teammates, regional
-- Elitserien, division rivals) — just called against different team ids.
-- Junior players excluded (see bits_player_junior.sql).
CREATE OR REPLACE FUNCTION get_team_roster(p_bits_team_id integer, p_limit integer DEFAULT 8)
RETURNS TABLE (
  public_id       uuid,
  name            text,
  licence_average integer,
  appearances     integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bp.public_id,
         CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
              ELSE bp.first_name || ' ' || bp.sur_name END AS name,
         bp.licence_average,
         count(*)::integer AS appearances
  FROM bits_match_player_results r
  JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
  JOIN bits_players bp ON bp.lic_nbr = r.lic_nbr
  WHERE ((bm.home_bits_team_id = p_bits_team_id AND r.is_home_team)
      OR (bm.away_bits_team_id = p_bits_team_id AND NOT r.is_home_team))
    AND bm.match_date >= '2025-07-01'
    AND NOT bits_player_is_junior(bp.lic_nbr)
  GROUP BY bp.public_id, bp.first_name, bp.sur_name, bp.licence_average
  ORDER BY appearances DESC, bp.licence_average DESC NULLS LAST
  LIMIT p_limit;
$$;

-- ─── get_division_rivals ───────────────────────────────────────────────────
-- Other teams in the same division this season. Used both directly (team
-- suggestions) and as the rival-team source for the player suggestion tier.
CREATE OR REPLACE FUNCTION get_division_rivals(p_bits_team_id integer, p_limit integer DEFAULT 5)
RETURNS TABLE (bits_team_id integer, name text, club_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT t.bits_team_id, t.name, t.club_name
  FROM team_current_division(p_bits_team_id) d
  JOIN bits_matches bm ON bm.bits_division_id = d.bits_division_id AND bm.match_date >= '2025-07-01'
  JOIN bits_teams t ON t.bits_team_id IN (bm.home_bits_team_id, bm.away_bits_team_id)
  WHERE t.bits_team_id != p_bits_team_id
  LIMIT p_limit;
$$;

-- ─── get_nearby_teams ───────────────────────────────────────────────────────
-- Team-follow suggestions: division rivals first, then same-county teams,
-- deduped. No fallback expansion if a team has no rivals/county-mates synced
-- yet — an empty/short list is honest, not padded with unrelated teams.
CREATE OR REPLACE FUNCTION get_nearby_teams(p_bits_team_id integer, p_limit integer DEFAULT 12)
RETURNS TABLE (bits_team_id integer, name text, club_name text, reason text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH rivals AS (
    SELECT r.bits_team_id, r.name, r.club_name, 'division'::text AS reason
    FROM get_division_rivals(p_bits_team_id, p_limit) r
  ),
  my_county AS (
    SELECT c.county
    FROM bits_teams t JOIN bits_clubs c ON c.bits_id = t.bits_club_id
    WHERE t.bits_team_id = p_bits_team_id
  ),
  county_mates AS (
    SELECT t.bits_team_id, t.name, t.club_name, 'county'::text AS reason
    FROM bits_teams t
    JOIN bits_clubs c ON c.bits_id = t.bits_club_id
    JOIN my_county mc ON mc.county = c.county
    WHERE mc.county IS NOT NULL AND t.bits_team_id != p_bits_team_id
  )
  SELECT * FROM rivals
  UNION
  SELECT * FROM county_mates WHERE county_mates.bits_team_id NOT IN (SELECT bits_team_id FROM rivals)
  LIMIT p_limit;
$$;

-- ─── get_regional_elitserien_teams ─────────────────────────────────────────
-- Up to one Elitserien team per gender (Herrar/Damer parsed from
-- division_name — no structured gender column exists) whose club shares the
-- input team's county. Returns 0 rows if there's no Elitserien club in
-- region — deliberately not approximated with a "closest" fallback.
CREATE OR REPLACE FUNCTION get_regional_elitserien_teams(p_bits_team_id integer)
RETURNS TABLE (bits_team_id integer, name text, club_name text, division_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_county AS (
    SELECT c.county
    FROM bits_teams t JOIN bits_clubs c ON c.bits_id = t.bits_club_id
    WHERE t.bits_team_id = p_bits_team_id
  )
  SELECT DISTINCT ON (CASE WHEN bm.division_name ILIKE '%damer%' THEN 'damer' ELSE 'herrar' END)
    t.bits_team_id, t.name, t.club_name, bm.division_name
  FROM my_county mc
  JOIN bits_clubs c ON c.county = mc.county AND mc.county IS NOT NULL
  JOIN bits_teams t ON t.bits_club_id = c.bits_id
  JOIN bits_matches bm
    ON (bm.home_bits_team_id = t.bits_team_id OR bm.away_bits_team_id = t.bits_team_id)
   AND bm.match_date >= '2025-07-01'
   AND bm.division_name ILIKE 'Elitserien%'
  WHERE t.bits_team_id != p_bits_team_id
  ORDER BY (CASE WHEN bm.division_name ILIKE '%damer%' THEN 'damer' ELSE 'herrar' END);
$$;

GRANT EXECUTE ON FUNCTION team_current_division(integer)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_team_roster(integer, integer)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_division_rivals(integer, integer)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_teams(integer, integer)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_regional_elitserien_teams(integer)   TO anon, authenticated;
