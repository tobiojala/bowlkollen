-- Fixes a parsing bug: is_home_team was derived from the wrong dimension of the
-- BITS GetMatchScores response (inner scores[] index — the rotating physical
-- table — instead of the outer boards[] index, which is what actually splits
-- into home/away halves). Verified against known home_score/away_score totals
-- across multiple matches and divisions (both 2-board and 4-board formats):
-- boards[0..half) = home team, boards[half..end) = away team, where
-- half = floor(totalBoards / 2).
--
-- This repairs all already-synced rows. The sync code itself (bits-sync.ts)
-- was fixed separately so all future syncs are correct from the start.
-- Safe to re-run — it's a no-op once everything matches.

CREATE OR REPLACE FUNCTION fix_bits_home_team_assignment()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE bits_match_scores ms
  SET    is_home_team = (ms.board <= mbc.half)
  FROM (
    SELECT bits_match_id, (MAX(board) / 2) AS half  -- integer division = floor
    FROM   bits_match_scores
    GROUP  BY bits_match_id
  ) mbc
  WHERE  ms.bits_match_id = mbc.bits_match_id
  AND    ms.is_home_team IS DISTINCT FROM (ms.board <= mbc.half);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
