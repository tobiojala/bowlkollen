-- submit_team_claim verifies a license against the roster but never stored
-- *which* bits_players row matched — so there was no way to show a real name
-- (only an email) for who responded to an availability poll or sits in a
-- lineup slot's picker context. This links a claim to the specific roster
-- player it was verified against.
--
-- Only set when the license matched THIS team's roster (played a match for
-- them) — not the club-fallback branch, which only proves club membership
-- and could ambiguously point at a sibling team's player at the same club.

ALTER TABLE public.team_claims
  ADD COLUMN IF NOT EXISTS matched_public_id uuid REFERENCES bits_players(public_id);

CREATE OR REPLACE FUNCTION submit_team_claim(p_bits_team_id integer, p_lic_nbr text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lic               text := upper(trim(p_lic_nbr));
  v_team_club         integer;
  v_is_junior         boolean;
  v_roster_matched    boolean;
  v_club_matched      boolean;
  v_matched_public_id uuid;
  v_status            text;
  v_claim_id          uuid;
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

  v_roster_matched := EXISTS (
    SELECT 1 FROM bits_match_player_results r
    JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
    WHERE upper(r.lic_nbr) = v_lic
      AND ((bm.home_bits_team_id = p_bits_team_id AND r.is_home_team)
        OR (bm.away_bits_team_id = p_bits_team_id AND NOT r.is_home_team))
  );
  v_club_matched := EXISTS (
    SELECT 1 FROM bits_players bp
    WHERE upper(bp.lic_nbr) = v_lic AND bp.agreement_club_id = v_team_club
  );

  IF v_roster_matched THEN
    SELECT bp.public_id INTO v_matched_public_id FROM bits_players bp WHERE upper(bp.lic_nbr) = v_lic LIMIT 1;
  END IF;

  v_is_junior := bits_player_is_junior(v_lic);
  v_status    := CASE WHEN (v_roster_matched OR v_club_matched) AND NOT v_is_junior THEN 'verified' ELSE 'pending' END;

  -- Membership only — role always starts as 'player'; an existing chosen role
  -- is never clobbered by a re-submit.
  INSERT INTO team_claims (user_id, bits_team_id, status, role, claimed_at, verified_at, matched_public_id)
  VALUES (auth.uid(), p_bits_team_id, v_status, 'player', now(), CASE WHEN v_status = 'verified' THEN now() ELSE NULL END, v_matched_public_id)
  ON CONFLICT (user_id, bits_team_id) DO UPDATE
    SET status = excluded.status, claimed_at = excluded.claimed_at, verified_at = excluded.verified_at,
        matched_public_id = COALESCE(excluded.matched_public_id, team_claims.matched_public_id)
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object('claim_id', v_claim_id, 'status', v_status);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_team_claim(integer, text) TO authenticated;
