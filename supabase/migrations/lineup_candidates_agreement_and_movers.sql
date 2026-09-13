-- Laguttagning candidate correctness (2026-09-13). Two roster problems, both
-- systemic (every team), fixed at the RPC:
--
--   1. AVTAL players were MISSING. A "spelaravtal" is a dual registration: a player's
--      PRIMARY club is in bits_players.club_name and a SECONDARY contracted club in
--      agreement_club_id / agreement_club_name (see bits_player_agreements.sql). The
--      old candidate set keyed only on club_name, so a player contracted to play for
--      THIS club but licensed elsewhere (e.g. Ottilia Gunnarsson: primary BK
--      Femtionian, agreement Team X-Calibur) never appeared. Now included.
--
--   2. LEAVERS could still show. The club-primary set trusts bits_players.club_name,
--      which lags a transfer until the licence sync catches up — so a player who has
--      actually moved kept appearing. We now cross-check real participation: if this
--      season a player has bowled ONLY for OTHER clubs' teams (never this club's),
--      they've moved and are dropped, even when their stored primary club is stale.
--      Someone currently registered here who simply hasn't bowled yet is kept.
--
-- Agreement data is sparse (fetched per-licence on demand, no bulk endpoint), so
-- avtal coverage improves as the deep sync fills agreement_club_* over time.
--
-- Return shape is unchanged; DROP+CREATE only because that's how this fn is managed.

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
  club AS (
    SELECT bits_club_id, club_name FROM bits_teams WHERE bits_team_id = p_bits_team_id
  ),
  seasons AS (SELECT max(season_id) AS cur FROM bits_matches),
  -- Per player, how they've actually participated by club in the recent window —
  -- so we can tell a current squad member from a moved-on leaver with stale data.
  play AS (
    SELECT
      upper(r.lic_nbr) AS lic,
      bool_or(bm.season_id = (SELECT cur FROM seasons) AND bt.bits_club_id =  (SELECT bits_club_id FROM club)) AS here_now,
      bool_or(bm.season_id = (SELECT cur FROM seasons) AND bt.bits_club_id <> (SELECT bits_club_id FROM club)) AS elsewhere_now,
      bool_or(bm.season_id >= (SELECT cur FROM seasons) - 1)                                                   AS active_recent
    FROM bits_match_player_results r
    JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
    JOIN bits_teams  bt ON bt.bits_team_id = (CASE WHEN r.is_home_team THEN bm.home_bits_team_id ELSE bm.away_bits_team_id END)
    WHERE r.lic_nbr IS NOT NULL AND bm.season_id >= (SELECT cur FROM seasons) - 1
    GROUP BY upper(r.lic_nbr)
  ),
  cand AS (
    -- 1. Primary registration = this club, active in the last/upcoming season, and
    --    NOT a stale-data leaver (this season has played only for other clubs).
    SELECT DISTINCT upper(bp.lic_nbr) AS lic
    FROM bits_players bp
    JOIN play p ON p.lic = upper(bp.lic_nbr)
    WHERE bp.club_name = (SELECT club_name FROM club)
      AND bp.lic_nbr IS NOT NULL
      AND p.active_recent
      AND NOT (p.elsewhere_now AND NOT p.here_now)
    UNION
    -- 2. Avtal — a spelaravtal (secondary registration) contracted to THIS club.
    SELECT upper(bp.lic_nbr)
    FROM bits_players bp
    WHERE bp.lic_nbr IS NOT NULL
      AND ( bp.agreement_club_id = (SELECT bits_club_id FROM club)
         OR btrim(lower(bp.agreement_club_name)) = btrim(lower((SELECT club_name FROM club))) )
    UNION
    -- 3. Verified app members (roster match OR claimed player) — always included, even
    --    if their licence club text hasn't synced.
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
  best_venue AS (
    SELECT DISTINCT ON (lic) lic, hall_name, round(avg(pins)) AS avg, count(*) AS games
    FROM games WHERE hall_name IS NOT NULL
    GROUP BY lic, hall_name HAVING count(*) >= 6
    ORDER BY lic, round(avg(pins)) DESC, count(*) DESC
  ),
  best_division AS (
    SELECT DISTINCT ON (lic) lic, division_name, round(avg(pins)) AS avg, count(*) AS games
    FROM games WHERE division_name IS NOT NULL
    GROUP BY lic, division_name HAVING count(*) >= 6
    ORDER BY lic, round(avg(pins)) DESC, count(*) DESC
  ),
  best_squad AS (
    SELECT DISTINCT ON (lic) lic, squad, round(avg(pins)) AS avg, count(*) AS games
    FROM games WHERE squad IS NOT NULL
    GROUP BY lic, squad HAVING count(*) >= 6
    ORDER BY lic, round(avg(pins)) DESC, count(*) DESC
  ),
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
