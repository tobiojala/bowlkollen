-- Link team membership → player identity. A verified, roster-matched team claim
-- (arrived via a team you actually play on, or an invite you were sent) is itself a
-- vouch for WHO you are — so it should grant the player_claim that drives the
-- profile verified badge, ownership, and the Spärr pill. Before this, bootstrap/
-- team invite codes left invitees verified-as-captain but badge-less (they only
-- filled team_claims, and the badge reads player_claims). Solo license claims with
-- no team vouch still stay pending → /admin/claims (impersonation guardrail intact,
-- see project_claim_identity_hardening).
--
-- Only touches player_claims when none is already verified (never clobbers an
-- existing verified identity). Team claims only reach 'verified' for adults, so this
-- never auto-verifies a junior.

CREATE OR REPLACE FUNCTION submit_team_claim(p_bits_team_id integer, p_lic_nbr text, p_invite_code text DEFAULT NULL)
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
  v_code              invite_codes%ROWTYPE;
  v_vouched           boolean := false;
  v_bootstrap         boolean := false;
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

  -- A valid, team-scoped invite code is the vouching signal. Re-checked live
  -- (not just at issuance) so a since-removed member's old codes stop working.
  IF p_invite_code IS NOT NULL THEN
    SELECT * INTO v_code FROM invite_codes
    WHERE code = p_invite_code AND is_active = true AND scope_bits_team_id = p_bits_team_id
      AND code_type IN ('team_claim', 'new_team_bootstrap');

    IF v_code.id IS NOT NULL THEN
      IF v_code.code_type = 'new_team_bootstrap' THEN
        v_vouched   := true;
        v_bootstrap := true;
      ELSIF EXISTS (
        SELECT 1 FROM team_claims
        WHERE user_id = v_code.issued_by AND bits_team_id = p_bits_team_id AND status = 'verified'
      ) THEN
        v_vouched := true;
      END IF;
    END IF;
  END IF;

  INSERT INTO team_claims (user_id, bits_team_id, status, role, claimed_at, verified_at, matched_public_id, vouched)
  VALUES (auth.uid(), p_bits_team_id, v_status, 'player', now(), CASE WHEN v_status = 'verified' THEN now() ELSE NULL END, v_matched_public_id, v_vouched)
  ON CONFLICT (user_id, bits_team_id) DO UPDATE
    SET status = excluded.status, claimed_at = excluded.claimed_at, verified_at = excluded.verified_at,
        matched_public_id = COALESCE(excluded.matched_public_id, team_claims.matched_public_id),
        vouched = team_claims.vouched OR excluded.vouched
  RETURNING id INTO v_claim_id;

  -- A redeemed bootstrap code makes the founding member immediately
  -- captain-eligible — the admin who issued it already vetted this team.
  IF v_bootstrap AND v_status = 'verified' THEN
    UPDATE team_claims SET role = 'captain' WHERE id = v_claim_id;
  END IF;

  -- Grant the player identity that drives the badge/ownership, unless already verified.
  IF v_status = 'verified' AND v_matched_public_id IS NOT NULL THEN
    INSERT INTO player_claims (user_id, player_id, status, claimed_at, verified_at)
    VALUES (auth.uid(), v_matched_public_id, 'verified', now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET player_id = excluded.player_id, status = 'verified', verified_at = now()
      WHERE player_claims.status <> 'verified';
  END IF;

  RETURN jsonb_build_object('claim_id', v_claim_id, 'status', v_status);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_team_claim(integer, text, text) TO authenticated;

-- ─── one-time backfill ───────────────────────────────────────────────────────
-- Everyone already verified-on-a-team with a matched player but no verified
-- player_claim (e.g. bootstrap captains) gets their player identity now.
INSERT INTO player_claims (user_id, player_id, status, claimed_at, verified_at)
SELECT DISTINCT ON (tc.user_id) tc.user_id, tc.matched_public_id, 'verified', now(), now()
FROM team_claims tc
WHERE tc.status = 'verified' AND tc.matched_public_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM player_claims pc WHERE pc.user_id = tc.user_id AND pc.status = 'verified')
ORDER BY tc.user_id, tc.verified_at DESC NULLS LAST
ON CONFLICT (user_id) DO UPDATE
  SET player_id = excluded.player_id, status = 'verified', verified_at = now()
  WHERE player_claims.status <> 'verified';
