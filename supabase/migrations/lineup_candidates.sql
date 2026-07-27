-- Laguttagning intelligence: for a given match, rank the team's candidates by how
-- they actually perform IN THAT CONTEXT — their average at that center and in that
-- division — folded with availability. Plus each player's career highlights: the
-- center they're strongest at ("bäst i") and the squad they perform best with (a
-- club fields several teams — A/B/F — and people move between them).
--
-- Data: every finished game lives in bits_match_player_results.series, each joins
-- bits_matches for hall_name + division_name + the team worn that day. Matched by
-- LICENCE NUMBER only, so a player's whole career travels with them across clubs.
--
-- Team-private. Ranking: available first (yes>maybe>unknown>no), then fit here
-- (venue avg if enough games → division → overall). "Best" needs a higher bar so a
-- single hot night can't be someone's headline.

-- Return shape changed over time (added best_division etc.), and CREATE OR REPLACE
-- can't alter a function's OUT columns — drop then recreate.
DROP FUNCTION IF EXISTS public.get_lineup_candidates(integer, integer);

CREATE OR REPLACE FUNCTION public.get_lineup_candidates(p_bits_team_id integer, p_bits_match_id integer)
RETURNS TABLE (
  public_id        uuid,
  player_name      text,
  overall_avg      integer,
  overall_games    integer,
  venue_avg        integer,
  venue_games      integer,
  division_avg     integer,
  division_games   integer,
  best_venue          text,
  best_venue_avg      integer,
  best_venue_games    integer,
  best_division       text,
  best_division_avg   integer,
  best_division_games integer,
  best_squad          text,
  best_squad_avg      integer,
  best_squad_games    integer,
  home_team           text,
  home_division       text,
  availability        text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH m AS (
    SELECT hall_name, division_name FROM bits_matches WHERE bits_match_id = p_bits_match_id
  ),
  cand AS (
    -- Everyone CURRENTLY licensed with the club (bits_players.club_name) — the real,
    -- active roster across the club's teams. Excludes players who've since moved clubs
    -- (their club_name now points elsewhere), which the old "ever played" pool leaked in.
    SELECT DISTINCT upper(bp.lic_nbr) AS lic
    FROM bits_players bp
    WHERE bp.club_name = (SELECT club_name FROM bits_teams WHERE bits_team_id = p_bits_team_id)
      AND bp.lic_nbr IS NOT NULL
    UNION
    -- Verified app members (roster match OR claimed player) — always included, even if
    -- their licence club text hasn't synced.
    SELECT upper(bp.lic_nbr)
    FROM team_claims tc
    JOIN bits_players bp ON bp.public_id = tc.matched_public_id
    WHERE tc.bits_team_id = p_bits_team_id AND tc.status = 'verified' AND bp.lic_nbr IS NOT NULL
    UNION
    SELECT upper(bp.lic_nbr)
    FROM team_claims tc
    JOIN player_claims pc ON pc.user_id = tc.user_id AND pc.status = 'verified'
    JOIN bits_players bp ON bp.public_id = pc.player_id
    WHERE tc.bits_team_id = p_bits_team_id AND tc.status = 'verified' AND bp.lic_nbr IS NOT NULL
  ),
  -- Every game each candidate has bowled, with venue, division, and the squad worn.
  games AS (
    SELECT
      upper(r.lic_nbr) AS lic, g.pins, bm.hall_name, bm.division_name,
      CASE WHEN r.is_home_team THEN bm.home_team_name ELSE bm.away_team_name END AS squad
    FROM bits_match_player_results r
    JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
    JOIN cand c ON c.lic = upper(r.lic_nbr)
    CROSS JOIN LATERAL unnest(r.series) AS g(pins)
    WHERE bm.is_finished = true AND g.pins > 0
  ),
  agg AS (
    SELECT
      lic,
      round(avg(pins))                                                             AS overall_avg,
      count(*)                                                                      AS overall_games,
      round(avg(pins) FILTER (WHERE hall_name     = (SELECT hall_name FROM m)))     AS venue_avg,
      count(*)        FILTER (WHERE hall_name     = (SELECT hall_name FROM m))      AS venue_games,
      round(avg(pins) FILTER (WHERE division_name = (SELECT division_name FROM m))) AS division_avg,
      count(*)        FILTER (WHERE division_name = (SELECT division_name FROM m))  AS division_games
    FROM games GROUP BY lic
  ),
  -- Strongest center (≥6 games so it's a real trend, not one night).
  best_venue AS (
    SELECT DISTINCT ON (lic) lic, hall_name, round(avg(pins)) AS avg, count(*) AS games
    FROM games WHERE hall_name IS NOT NULL
    GROUP BY lic, hall_name HAVING count(*) >= 6
    ORDER BY lic, round(avg(pins)) DESC, count(*) DESC
  ),
  -- Strongest division (higher or lower — where their game travels best).
  best_division AS (
    SELECT DISTINCT ON (lic) lic, division_name, round(avg(pins)) AS avg, count(*) AS games
    FROM games WHERE division_name IS NOT NULL
    GROUP BY lic, division_name HAVING count(*) >= 6
    ORDER BY lic, round(avg(pins)) DESC, count(*) DESC
  ),
  -- Strongest squad (which of the club's teams they shine with).
  best_squad AS (
    SELECT DISTINCT ON (lic) lic, squad, round(avg(pins)) AS avg, count(*) AS games
    FROM games WHERE squad IS NOT NULL
    GROUP BY lic, squad HAVING count(*) >= 6
    ORDER BY lic, round(avg(pins)) DESC, count(*) DESC
  ),
  -- Where they play MOST (not best) — their home team + division, for the spärr check.
  home_team AS (
    SELECT DISTINCT ON (lic) lic, squad, count(*) AS games
    FROM games WHERE squad IS NOT NULL
    GROUP BY lic, squad ORDER BY lic, count(*) DESC
  ),
  home_div AS (
    SELECT DISTINCT ON (lic) lic, division_name, count(*) AS games
    FROM games WHERE division_name IS NOT NULL
    GROUP BY lic, division_name ORDER BY lic, count(*) DESC
  ),
  -- Map a player (public_id) → the app account of the verified member who is that
  -- player, via roster match OR their claimed player. Used to attach availability.
  member AS (
    SELECT bp.public_id, tc.user_id
    FROM team_claims tc
    JOIN bits_players bp ON bp.public_id = tc.matched_public_id
    WHERE tc.bits_team_id = p_bits_team_id AND tc.status = 'verified'
    UNION
    SELECT bp.public_id, tc.user_id
    FROM team_claims tc
    JOIN player_claims pc ON pc.user_id = tc.user_id AND pc.status = 'verified'
    JOIN bits_players bp ON bp.public_id = pc.player_id
    WHERE tc.bits_team_id = p_bits_team_id AND tc.status = 'verified'
  )
  SELECT
    bp.public_id,
    CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
         ELSE bp.first_name || ' ' || bp.sur_name END AS player_name,
    a.overall_avg::int, COALESCE(a.overall_games, 0)::int,
    a.venue_avg::int,   COALESCE(a.venue_games, 0)::int,
    a.division_avg::int, COALESCE(a.division_games, 0)::int,
    bv.hall_name, bv.avg::int, bv.games::int,
    bd.division_name, bd.avg::int, bd.games::int,
    bs.squad, bs.avg::int, bs.games::int,
    ht.squad, hd.division_name,
    av.response AS availability
  FROM cand c
  JOIN bits_players bp ON upper(bp.lic_nbr) = c.lic
  LEFT JOIN agg a           ON a.lic  = c.lic
  LEFT JOIN best_venue bv   ON bv.lic = c.lic
  LEFT JOIN best_division bd ON bd.lic = c.lic
  LEFT JOIN best_squad bs   ON bs.lic = c.lic
  LEFT JOIN home_team ht    ON ht.lic = c.lic
  LEFT JOIN home_div hd     ON hd.lic = c.lic
  LEFT JOIN member mb ON mb.public_id = bp.public_id
  LEFT JOIN team_match_availability av ON av.user_id = mb.user_id
        AND av.bits_team_id = p_bits_team_id AND av.bits_match_id = p_bits_match_id
  WHERE EXISTS (
    SELECT 1 FROM team_claims me
    WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified'
  )
  ORDER BY
    CASE av.response WHEN 'yes' THEN 0 WHEN 'maybe' THEN 1 WHEN 'no' THEN 3 ELSE 2 END,
    COALESCE(
      CASE WHEN COALESCE(a.venue_games, 0)    >= 3 THEN a.venue_avg END,
      CASE WHEN COALESCE(a.division_games, 0) >= 3 THEN a.division_avg END,
      a.overall_avg, 0
    ) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_lineup_candidates(integer, integer) TO authenticated;
