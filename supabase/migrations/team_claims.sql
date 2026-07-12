-- "Claim your spot in the team" — a user verifies (via license number) that
-- they belong to a BITS team. Mirrors the player-claim flow
-- (claim_license_verification.sql): a license that belongs to the team's
-- roster or its club auto-verifies an adult instantly; juniors and
-- non-matches go to 'pending' admin review.
--
-- IMPORTANT: claiming makes you a MEMBER (role 'player'), never a captain.
-- Roles (player/captain/lagledare/reserv) are chosen by the member themselves
-- afterwards via set_team_role(), are not shown publicly, and 'captain' is
-- what will gate the lineup/admin tools.
--
-- club_claims already exists but is keyed to the legacy teams.uuid — BITS teams
-- are integers (bits_team_id), so this is a parallel table on the live data.

CREATE TABLE IF NOT EXISTS public.team_claims (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bits_team_id integer NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  role         text NOT NULL DEFAULT 'player',
  claimed_at   timestamptz DEFAULT now(),
  verified_at  timestamptz,
  UNIQUE (user_id, bits_team_id)
);

-- Defensive (idempotent whether or not the first version of this file ran):
ALTER TABLE public.team_claims ALTER COLUMN role SET DEFAULT 'player';
UPDATE public.team_claims SET role = 'player' WHERE role IS NULL OR role = 'captain';
ALTER TABLE public.team_claims ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.team_claims DROP CONSTRAINT IF EXISTS team_claims_role_check;
ALTER TABLE public.team_claims ADD CONSTRAINT team_claims_role_check
  CHECK (role IN ('player', 'captain', 'lagledare', 'reserv'));

CREATE INDEX IF NOT EXISTS team_claims_team_idx ON public.team_claims (bits_team_id);

ALTER TABLE public.team_claims ENABLE ROW LEVEL SECURITY;

-- A user sees and manages only their own claims. Roles are private by design —
-- no public SELECT policy.
DROP POLICY IF EXISTS team_claims_select_own ON public.team_claims;
CREATE POLICY team_claims_select_own ON public.team_claims
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS team_claims_delete_own ON public.team_claims;
CREATE POLICY team_claims_delete_own ON public.team_claims
  FOR DELETE USING (auth.uid() = user_id);

-- Inserts/updates go only through the SECURITY DEFINER functions below —
-- no direct write policies (a user must not be able to flip their own status).

-- ─── submit_team_claim ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION submit_team_claim(p_bits_team_id integer, p_lic_nbr text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lic       text := upper(trim(p_lic_nbr));
  v_team_club integer;
  v_is_junior boolean;
  v_matched   boolean;
  v_status    text;
  v_claim_id  uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF v_lic IS NULL OR v_lic = '' THEN
    RAISE EXCEPTION 'missing_license';
  END IF;

  SELECT bits_club_id INTO v_team_club FROM bits_teams WHERE bits_team_id = p_bits_team_id LIMIT 1;
  IF v_team_club IS NULL THEN
    RAISE EXCEPTION 'team_not_found';
  END IF;

  -- Verified if the license played for this team (roster) OR is licensed with
  -- the team's club. Roster covers established teams; club covers pre-season.
  v_matched :=
    EXISTS (
      SELECT 1 FROM bits_match_player_results r
      JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
      WHERE upper(r.lic_nbr) = v_lic
        AND ((bm.home_bits_team_id = p_bits_team_id AND r.is_home_team)
          OR (bm.away_bits_team_id = p_bits_team_id AND NOT r.is_home_team))
    )
    OR EXISTS (
      SELECT 1 FROM bits_players bp
      WHERE upper(bp.lic_nbr) = v_lic AND bp.agreement_club_id = v_team_club
    );

  v_is_junior := bits_player_is_junior(v_lic);
  v_status    := CASE WHEN v_matched AND NOT v_is_junior THEN 'verified' ELSE 'pending' END;

  -- Membership only — role always starts as 'player'; an existing chosen role
  -- is never clobbered by a re-submit.
  INSERT INTO team_claims (user_id, bits_team_id, status, role, claimed_at, verified_at)
  VALUES (auth.uid(), p_bits_team_id, v_status, 'player', now(), CASE WHEN v_status = 'verified' THEN now() ELSE NULL END)
  ON CONFLICT (user_id, bits_team_id) DO UPDATE
    SET status = excluded.status, claimed_at = excluded.claimed_at, verified_at = excluded.verified_at
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object('claim_id', v_claim_id, 'status', v_status);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_team_claim(integer, text) TO authenticated;

-- ─── set_team_role ────────────────────────────────────────────────────────────
-- A verified member picks their own role. Private (RLS keeps rows own-only);
-- 'captain' is what will unlock lineup building. Status can never be changed
-- through this — only the role column.
CREATE OR REPLACE FUNCTION set_team_role(p_bits_team_id integer, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_role NOT IN ('player', 'captain', 'lagledare', 'reserv') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  UPDATE team_claims
     SET role = p_role
   WHERE user_id = auth.uid()
     AND bits_team_id = p_bits_team_id
     AND status = 'verified';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_verified_member';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION set_team_role(integer, text) TO authenticated;
