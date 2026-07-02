-- License-number self-service claim verification. The claim flow was just a
-- name search with zero identity proof — undermines the junior guardrail
-- (an admin reviewing /admin/claims has nothing but a name match to judge
-- by). A correct license number auto-verifies adults instantly; juniors
-- always go to manual review regardless of a match, since knowing the
-- number proves identity knowledge, not guardianship — confirmed with user.
--
-- player_claims has UNIQUE(user_id) (found via live constraint check, not
-- in any migration — the table predates migration tracking). The existing
-- plain .insert() in profile/page.tsx would silently fail on a second
-- attempt; this RPC upserts instead, fixing that as a side-effect.

CREATE OR REPLACE FUNCTION submit_player_claim(p_public_id uuid, p_lic_nbr text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actual_lic_nbr text;
  v_is_junior       boolean;
  v_matched         boolean;
  v_status          text;
  v_claim_id        uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT lic_nbr INTO v_actual_lic_nbr FROM bits_players WHERE public_id = p_public_id;
  IF v_actual_lic_nbr IS NULL THEN
    RAISE EXCEPTION 'player_not_found';
  END IF;

  v_is_junior := bits_player_is_junior(v_actual_lic_nbr);
  v_matched   := p_lic_nbr IS NOT NULL AND upper(trim(p_lic_nbr)) = upper(v_actual_lic_nbr);
  v_status    := CASE WHEN v_matched AND NOT v_is_junior THEN 'verified' ELSE 'pending' END;

  INSERT INTO player_claims (user_id, player_id, status, claimed_at, verified_at)
  VALUES (auth.uid(), p_public_id, v_status, now(), CASE WHEN v_status = 'verified' THEN now() ELSE NULL END)
  ON CONFLICT (user_id) DO UPDATE
    SET player_id = excluded.player_id, status = excluded.status,
        claimed_at = excluded.claimed_at, verified_at = excluded.verified_at
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object('claim_id', v_claim_id, 'status', v_status);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_player_claim(uuid, text) TO authenticated;
