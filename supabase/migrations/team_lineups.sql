-- Lineup builder — captain assigns the roster to boards 1-4 (2 positions
-- each) + 2 reserves. Slots reference bits_players.public_id (the same
-- roster identity get_team_roster returns), not user_id — a captain can seat
-- anyone on the roster regardless of whether that person has an app account.
--
-- Published lineups are public (the whole point of a shareable team page —
-- fans see who's playing); drafts are visible only to the team. Both reads
-- and writes go through the SECURITY DEFINER functions below, not row
-- policies, since "public once published, private until then" isn't
-- expressible as a simple RLS predicate alongside "captain-only writes."

CREATE TABLE IF NOT EXISTS public.team_lineups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bits_team_id  integer NOT NULL,
  bits_match_id integer NOT NULL,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by    uuid REFERENCES auth.users(id),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (bits_team_id, bits_match_id)
);

CREATE TABLE IF NOT EXISTS public.team_lineup_slots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id  uuid NOT NULL REFERENCES team_lineups(id) ON DELETE CASCADE,
  public_id  uuid NOT NULL REFERENCES bits_players(public_id),
  bord       integer NOT NULL,             -- 0 = reserve
  position   integer NOT NULL,             -- 1 or 2
  is_reserve boolean NOT NULL DEFAULT false,
  UNIQUE (lineup_id, bord, position, is_reserve)
);

ALTER TABLE public.team_lineups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_lineup_slots ENABLE ROW LEVEL SECURITY;

-- ─── save_team_lineup ───────────────────────────────────────────────────────
-- Captain-only. Publishing requires all 8 non-reserve slots filled — the
-- server-side backstop for "only a complete lineup can go public," matching
-- what the captain confirms by tapping "Laguppställning klar."
CREATE OR REPLACE FUNCTION save_team_lineup(
  p_bits_team_id integer, p_bits_match_id integer, p_slots jsonb, p_publish boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lineup_id uuid;
  v_filled    integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_claims
    WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id
      AND status = 'verified' AND role = 'captain'
  ) THEN
    RAISE EXCEPTION 'not_captain';
  END IF;

  IF p_publish THEN
    SELECT count(DISTINCT (bord, position)) INTO v_filled
    FROM jsonb_to_recordset(p_slots) AS s(public_id uuid, bord integer, position integer, is_reserve boolean)
    WHERE s.is_reserve = false AND s.bord BETWEEN 1 AND 4 AND s.position IN (1, 2);

    IF v_filled < 8 THEN
      RAISE EXCEPTION 'lineup_incomplete';
    END IF;
  END IF;

  INSERT INTO team_lineups (bits_team_id, bits_match_id, status, created_by, updated_at)
  VALUES (p_bits_team_id, p_bits_match_id, CASE WHEN p_publish THEN 'published' ELSE 'draft' END, auth.uid(), now())
  ON CONFLICT (bits_team_id, bits_match_id) DO UPDATE
    SET status = excluded.status, updated_at = excluded.updated_at
  RETURNING id INTO v_lineup_id;

  DELETE FROM team_lineup_slots WHERE lineup_id = v_lineup_id;

  INSERT INTO team_lineup_slots (lineup_id, public_id, bord, position, is_reserve)
  SELECT v_lineup_id, s.public_id, s.bord, s.position, s.is_reserve
  FROM jsonb_to_recordset(p_slots) AS s(public_id uuid, bord integer, position integer, is_reserve boolean);

  RETURN jsonb_build_object('lineup_id', v_lineup_id, 'status', CASE WHEN p_publish THEN 'published' ELSE 'draft' END);
END;
$$;

GRANT EXECUTE ON FUNCTION save_team_lineup(integer, integer, jsonb, boolean) TO authenticated;

-- ─── get_team_lineup ─────────────────────────────────────────────────────────
-- Serves both the captain's own editor (sees the draft) and the public
-- preview on /lag (sees it only once published) — granted to anon too.
CREATE OR REPLACE FUNCTION get_team_lineup(p_bits_team_id integer, p_bits_match_id integer)
RETURNS TABLE (
  status      text,
  public_id   uuid,
  player_name text,
  bord        integer,
  position    integer,
  is_reserve  boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.status, s.public_id,
    CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
         ELSE bp.first_name || ' ' || bp.sur_name END AS player_name,
    s.bord, s.position, s.is_reserve
  FROM team_lineups l
  JOIN team_lineup_slots s ON s.lineup_id = l.id
  JOIN bits_players bp ON bp.public_id = s.public_id
  WHERE l.bits_team_id = p_bits_team_id AND l.bits_match_id = p_bits_match_id
    AND (
      l.status = 'published'
      OR EXISTS (
        SELECT 1 FROM team_claims tc
        WHERE tc.user_id = auth.uid() AND tc.bits_team_id = p_bits_team_id AND tc.status = 'verified'
      )
    )
  ORDER BY s.is_reserve, s.bord, s.position;
$$;

GRANT EXECUTE ON FUNCTION get_team_lineup(integer, integer) TO anon, authenticated;
