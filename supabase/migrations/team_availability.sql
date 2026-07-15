-- Team availability — "Kan du spela?" for an upcoming match. One row per
-- verified member per match; there's only ever one question, so this skips
-- the polls/responses split the legacy version had.

CREATE TABLE IF NOT EXISTS public.team_match_availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bits_team_id  integer NOT NULL,
  bits_match_id integer NOT NULL,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response      text NOT NULL CHECK (response IN ('yes', 'maybe', 'no')),
  note          text,
  responded_at  timestamptz DEFAULT now(),
  UNIQUE (bits_team_id, bits_match_id, user_id)
);

ALTER TABLE public.team_match_availability ENABLE ROW LEVEL SECURITY;

-- A user sees and manages only their own row directly; the team-wide view
-- goes through get_team_availability (SECURITY DEFINER) below instead, which
-- is what enforces "only verified teammates see the team's answers."
DROP POLICY IF EXISTS team_availability_select_own ON public.team_match_availability;
CREATE POLICY team_availability_select_own ON public.team_match_availability
  FOR SELECT USING (auth.uid() = user_id);

-- ─── submit_availability_response ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION submit_availability_response(
  p_bits_team_id integer, p_bits_match_id integer, p_response text, p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_response NOT IN ('yes', 'maybe', 'no') THEN
    RAISE EXCEPTION 'invalid_response';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM team_claims
    WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id AND status = 'verified'
  ) THEN
    RAISE EXCEPTION 'not_verified_member';
  END IF;

  INSERT INTO team_match_availability (bits_team_id, bits_match_id, user_id, response, note, responded_at)
  VALUES (p_bits_team_id, p_bits_match_id, auth.uid(), p_response, p_note, now())
  ON CONFLICT (bits_team_id, bits_match_id, user_id) DO UPDATE
    SET response = excluded.response, note = excluded.note, responded_at = excluded.responded_at;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_availability_response(integer, integer, text, text) TO authenticated;

-- ─── get_team_availability ──────────────────────────────────────────────────
-- Team-private — never granted to anon. display_name resolves through the
-- roster match captured on team_claims.matched_public_id, falling back to
-- the auth.users email local-part for older claims made before that column
-- existed.
CREATE OR REPLACE FUNCTION get_team_availability(p_bits_team_id integer, p_bits_match_id integer)
RETURNS TABLE (
  user_id      uuid,
  response     text,
  note         text,
  responded_at timestamptz,
  display_name text,
  public_id    uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.user_id, a.response, a.note, a.responded_at,
    COALESCE(
      CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
           ELSE bp.first_name || ' ' || bp.sur_name END,
      split_part(u.email, '@', 1)
    ) AS display_name,
    tc.matched_public_id AS public_id
  FROM team_match_availability a
  JOIN team_claims tc ON tc.user_id = a.user_id AND tc.bits_team_id = a.bits_team_id AND tc.status = 'verified'
  LEFT JOIN bits_players bp ON bp.public_id = tc.matched_public_id
  LEFT JOIN auth.users u ON u.id = a.user_id
  WHERE a.bits_team_id = p_bits_team_id AND a.bits_match_id = p_bits_match_id
    AND EXISTS (
      SELECT 1 FROM team_claims me
      WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified'
    )
  ORDER BY a.responded_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_team_availability(integer, integer) TO authenticated;
