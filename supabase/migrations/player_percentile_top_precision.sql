-- ─── get_player_percentile: fine-grained top % ───────────────────────────────
-- Returns the real "top X%" of the licence_average field (smaller = better).
-- Now numeric with one decimal BELOW 1% so the very best read as e.g. 0.1%
-- (top of the field) instead of being floored at a flat 1%; at or above 1% it
-- stays a clean integer (e.g. 47) so mid-field values aren't noisy.
--
-- NOTE: the value is already "top %" — callers must NOT do (100 - value). The
-- mobile client previously inverted it, showing elite players as 99%.
DROP FUNCTION IF EXISTS get_player_percentile(uuid);

CREATE FUNCTION get_player_percentile(p_public_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_avg  integer;
  total_count integer;
  below_count integer;
  top_pct     numeric;
BEGIN
  SELECT licence_average INTO target_avg FROM bits_players WHERE public_id = p_public_id;
  IF target_avg IS NULL OR target_avg <= 0 THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO total_count FROM bits_players WHERE licence_average IS NOT NULL AND licence_average > 0;
  IF total_count = 0 THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO below_count
  FROM bits_players
  WHERE licence_average IS NOT NULL AND licence_average > 0 AND licence_average < target_avg;

  -- fraction of the field at or above this player = the "top" fraction, ×100
  top_pct := (1 - below_count::numeric / total_count) * 100;

  IF top_pct < 1 THEN
    RETURN GREATEST(0.1, ROUND(top_pct, 1)); -- elite: 0.1 .. 0.9
  ELSE
    RETURN ROUND(top_pct);                   -- rest: clean integer
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_player_percentile(uuid) TO anon, authenticated;
