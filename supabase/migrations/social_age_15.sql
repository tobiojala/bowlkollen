-- ─── Age policy: visibility for all ages, social from the year they turn 15 ───
-- Decision (2026-08-25): profiles + results are public BITS data, so nothing is
-- hidden by age. The "junior" flag now gates ONLY social features (being followed,
-- follow suggestions, instant self-claim) and lifts the calendar YEAR a player
-- turns 15 — matching that 15–17-year-olds are active, present competitors.
--
-- One function drives every social gate (follow-guard trigger, get_player_identity
-- .is_junior → the follow-button/notice swap, claim verification, suggestions), so
-- redefining it here shifts them all from <18 to <15 at once.

CREATE OR REPLACE FUNCTION bits_player_is_junior(p_lic_nbr text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  yy         int;
  century    int;
  birth_year int;
BEGIN
  -- Licence format [K|M]DDMMYY… — we only need the birth year for the rule.
  IF p_lic_nbr IS NULL OR p_lic_nbr !~ '^[KM][0-9]{6}' THEN
    RETURN false;
  END IF;

  yy      := substring(p_lic_nbr from 6 for 2)::int;
  century := CASE WHEN yy <= (extract(year from current_date)::int % 100) THEN 2000 ELSE 1900 END;
  birth_year := century + yy;

  -- Social gate only: a "junior" until the calendar year they turn 15. From that
  -- year on, follow/social works. Visibility is never gated by age.
  RETURN (extract(year from current_date)::int - birth_year) < 15;
END;
$$;

-- Visibility: the "recent players" discover feed no longer excludes juniors —
-- all ages are findable (following the youngest is still blocked by the
-- follow-guard trigger, which reads the function above).
CREATE OR REPLACE FUNCTION get_discover_recent_players(p_limit integer DEFAULT 40)
RETURNS TABLE (
  public_id   uuid,
  name        text,
  club_name   text,
  last_total  integer,
  last_date   date,
  hall_name   text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public_id, name, club_name, last_total, last_date, hall_name
  FROM (
    SELECT DISTINCT ON (bp.public_id)
      bp.public_id,
      CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
           ELSE bp.first_name || ' ' || bp.sur_name END AS name,
      bp.club_name,
      bmpr.total_result AS last_total,
      bm.match_date     AS last_date,
      bm.hall_name
    FROM bits_match_player_results bmpr
    JOIN bits_matches bm ON bm.bits_match_id = bmpr.bits_match_id
    JOIN bits_players bp ON bp.lic_nbr = bmpr.lic_nbr
    ORDER BY bp.public_id, bm.match_date DESC
  ) recent
  ORDER BY last_date DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_discover_recent_players(integer) TO anon, authenticated;
