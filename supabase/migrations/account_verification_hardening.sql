-- Account model hardening — docs/ACCOUNT_MODEL.md (approved 2026-08-19).
--
-- A licence number is a FINDABLE, not-secret identifier, so it must not auto-verify
-- identity (AGENTS.md security rule 5). This REVERSES the earlier "adult licence
-- auto-verifies" behaviour (claim_license_verification.sql + invite_scoped_claims.sql).
--
-- New rule for BOTH claim paths:
--   • Invite code (a vouch by a currently-verified member / admin bootstrap) → verified, instant.
--   • Licence alone → PENDING review, even on a roster/club match (a matched licence proves
--     the licence is on the team, not that the CLAIMANT is that person).
--   • Juniors → always pending (guardrail unchanged).
--   • Bootstrap code → verified + captain (unchanged).
--
-- Clients already handle a 'pending' result (native ga-med + web ClaimTeamSheet show
-- "skickad för granskning"), so no client change is required for correctness.
--
-- NOTE (follow-up, intentionally not in this migration): with this change a player who
-- claims by licence alone stays PENDING until a captain/admin approves. To keep the
-- code path giving instant *player* verification too, a later step can derive a verified
-- player_claim from a vouched, roster-matched team_claim (matched_public_id). Kept out
-- here to keep the security change small and reviewable.

-- ── 1) Player-identity claim: licence alone → pending ────────────────────────
CREATE OR REPLACE FUNCTION submit_player_claim(p_public_id uuid, p_lic_nbr text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actual_lic_nbr text;
  v_status         text := 'pending';   -- licence is not identity proof → always review
  v_claim_id       uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Keep the player-exists check; p_lic_nbr is retained for signature compatibility
  -- and audit context but no longer grants verification on its own.
  SELECT lic_nbr INTO v_actual_lic_nbr FROM bits_players WHERE public_id = p_public_id;
  IF v_actual_lic_nbr IS NULL THEN
    RAISE EXCEPTION 'player_not_found';
  END IF;

  INSERT INTO player_claims (user_id, player_id, status, claimed_at, verified_at)
  VALUES (auth.uid(), p_public_id, v_status, now(), NULL)
  ON CONFLICT (user_id) DO UPDATE
    SET player_id = excluded.player_id, status = excluded.status,
        claimed_at = excluded.claimed_at, verified_at = excluded.verified_at
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object('claim_id', v_claim_id, 'status', v_status);
END;
$$;
GRANT EXECUTE ON FUNCTION submit_player_claim(uuid, text) TO authenticated;

-- ── 2) Team claim: verified ONLY via a vouch (invite code); licence → pending ─
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

  -- Roster match is kept ONLY to record which player this is (admin/review
  -- context) — it never grants verification on its own any more.
  v_roster_matched := EXISTS (
    SELECT 1 FROM bits_match_player_results r
    JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
    WHERE upper(r.lic_nbr) = v_lic
      AND ((bm.home_bits_team_id = p_bits_team_id AND r.is_home_team)
        OR (bm.away_bits_team_id = p_bits_team_id AND NOT r.is_home_team))
  );
  IF v_roster_matched THEN
    SELECT bp.public_id INTO v_matched_public_id FROM bits_players bp WHERE upper(bp.lic_nbr) = v_lic LIMIT 1;
  END IF;

  v_is_junior := bits_player_is_junior(v_lic);

  -- Vouching is the ONLY instant-verify signal. A valid, team-scoped invite code
  -- from a currently-verified member (re-checked live) or an admin bootstrap code.
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

  -- CHANGED: verified only via a vouch, never for juniors. Licence alone → pending,
  -- even on a roster/club match (previously this auto-verified adults).
  v_status := CASE WHEN v_vouched AND NOT v_is_junior THEN 'verified' ELSE 'pending' END;

  INSERT INTO team_claims (user_id, bits_team_id, status, role, claimed_at, verified_at, matched_public_id, vouched)
  VALUES (auth.uid(), p_bits_team_id, v_status, 'player', now(), CASE WHEN v_status = 'verified' THEN now() ELSE NULL END, v_matched_public_id, v_vouched)
  ON CONFLICT (user_id, bits_team_id) DO UPDATE
    SET status = excluded.status, claimed_at = excluded.claimed_at, verified_at = excluded.verified_at,
        matched_public_id = COALESCE(excluded.matched_public_id, team_claims.matched_public_id),
        vouched = team_claims.vouched OR excluded.vouched
  RETURNING id INTO v_claim_id;

  -- A redeemed bootstrap code makes the founding member captain-eligible.
  IF v_bootstrap AND v_status = 'verified' THEN
    UPDATE team_claims SET role = 'captain' WHERE id = v_claim_id;
  END IF;

  RETURN jsonb_build_object('claim_id', v_claim_id, 'status', v_status);
END;
$$;
GRANT EXECUTE ON FUNCTION submit_team_claim(integer, text, text) TO authenticated;
