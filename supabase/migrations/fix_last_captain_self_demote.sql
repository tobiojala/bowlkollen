-- Fix: a captain could self-demote via set_team_role even when they were the
-- ONLY captain, stranding the team with no captain and no self-service way back
-- (set_team_role blocks self-promotion to captain unless vouched). Add the same
-- last-captain guard set_member_role already has. Full re-create with the guard.
CREATE OR REPLACE FUNCTION set_team_role(p_bits_team_id integer, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim       team_claims%ROWTYPE;
  v_has_captain boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_role NOT IN ('player', 'captain', 'lagledare', 'reserv') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  SELECT * INTO v_claim FROM team_claims
  WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id AND status = 'verified';

  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'not_verified_member';
  END IF;

  -- Never leave the team captain-less: block the last captain from self-demoting.
  IF v_claim.role = 'captain' AND p_role <> 'captain' THEN
    IF (SELECT count(*) FROM team_claims
          WHERE bits_team_id = p_bits_team_id AND status = 'verified' AND role = 'captain') <= 1 THEN
      RAISE EXCEPTION 'last_captain';
    END IF;
  END IF;

  IF p_role = 'captain' AND v_claim.role != 'captain' THEN
    SELECT EXISTS (
      SELECT 1 FROM team_claims WHERE bits_team_id = p_bits_team_id AND status = 'verified' AND role = 'captain'
    ) INTO v_has_captain;

    IF v_has_captain THEN
      RAISE EXCEPTION 'captain_exists_use_transfer';
    END IF;

    -- Self-service to captain only for a bootstrap-vouched member; others request.
    IF NOT v_claim.vouched THEN
      RAISE EXCEPTION 'captain_needs_request';
    END IF;
  END IF;

  UPDATE team_claims SET role = p_role WHERE id = v_claim.id;
END;
$$;
GRANT EXECUTE ON FUNCTION set_team_role(integer, text) TO authenticated;
