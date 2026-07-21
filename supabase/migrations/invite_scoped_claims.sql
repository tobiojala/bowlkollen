-- Extends the soft-launch invite system (invite_codes) to scope claims, not
-- just site access, and gates captain elevation for real — closing two holes
-- found this session:
--   1. A license number alone isn't proof of identity (findable on
--      bits.swebowl.se) — team_claims.vouched now distinguishes "a number
--      matched" from "arrived via a link a currently-verified teammate, or
--      an admin, actually shared."
--   2. set_team_role let ANY verified member self-declare captain with zero
--      checks — the single highest-blast-radius action in the whole claim
--      system (controls the lineup, sees every teammate's availability).
--
-- New captain model: the ONLY way to become captain is (a) a redeemed
-- new_team_bootstrap code (admin-vetted, sets it automatically at claim
-- time), or (b) a direct hand-off from the current captain (transfer_captain).
-- There is deliberately no "just self-declare" path anymore, including no
-- "I'm the only member" escape hatch — that was tried and rejected during
-- design because it's exactly as exploitable as the original hole for any
-- brand-new team (which is most of them). A verified member with no captain
-- yet calls request_captain(); an admin actions the queue via
-- admin_bootstrap_captain() — bounded by number of teams, not players.

-- ─── invite_codes: add scope ────────────────────────────────────────────────
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS issued_by uuid REFERENCES auth.users(id);
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS scope_bits_team_id integer;
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS code_type text NOT NULL DEFAULT 'site_access';
ALTER TABLE public.invite_codes DROP CONSTRAINT IF EXISTS invite_codes_code_type_check;
ALTER TABLE public.invite_codes ADD CONSTRAINT invite_codes_code_type_check
  CHECK (code_type IN ('site_access', 'team_claim', 'new_team_bootstrap'));

-- ─── team_claims: vouching + captain request tracking ───────────────────────
ALTER TABLE public.team_claims ADD COLUMN IF NOT EXISTS vouched boolean NOT NULL DEFAULT false;
ALTER TABLE public.team_claims ADD COLUMN IF NOT EXISTS captain_requested_at timestamptz;

-- ─── validate_and_redeem_invite_code: now returns scope, not just pass/fail ──
-- The one existing caller (app/invite/[code]/route.ts) only reads `.valid`,
-- so this is behavior-compatible for the flat site-access gate — just
-- richer for the new claim-scoped callers.
CREATE OR REPLACE FUNCTION validate_and_redeem_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row invite_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM invite_codes WHERE code = p_code;
  IF v_row.id IS NULL OR v_row.is_active IS NOT TRUE THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  UPDATE invite_codes SET click_count = click_count + 1 WHERE code = p_code;

  RETURN jsonb_build_object(
    'valid', true,
    'code_type', v_row.code_type,
    'scope_bits_team_id', v_row.scope_bits_team_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION validate_and_redeem_invite_code(text) TO anon, authenticated;

-- ─── get_invite_scope ────────────────────────────────────────────────────────
-- Read-only peek (no click_count side effect, unlike the redeem function
-- above) — used by onboarding to pre-fill the team + claim sheet when
-- someone arrives via a scoped link. Knowing a code's scope requires already
-- having the code string, so this doesn't leak anything new.
CREATE OR REPLACE FUNCTION get_invite_scope(p_code text)
RETURNS TABLE (code_type text, scope_bits_team_id integer, team_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ic.code_type, ic.scope_bits_team_id, bt.name
  FROM invite_codes ic
  LEFT JOIN bits_teams bt ON bt.bits_team_id = ic.scope_bits_team_id
  WHERE ic.code = p_code AND ic.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION get_invite_scope(text) TO anon, authenticated;

-- ─── create_team_invite_code ─────────────────────────────────────────────────
-- Any verified member can mint a shareable code for their own team — sharing
-- the link IS the vouch, no separate confirm/deny UI needed.
CREATE OR REPLACE FUNCTION create_team_invite_code(p_bits_team_id integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_claims
    WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id AND status = 'verified'
  ) THEN
    RAISE EXCEPTION 'not_verified_member';
  END IF;

  v_code := encode(gen_random_bytes(9), 'base64');
  v_code := replace(replace(replace(v_code, '/', '_'), '+', '-'), '=', '');

  INSERT INTO invite_codes (code, code_type, scope_bits_team_id, issued_by)
  VALUES (v_code, 'team_claim', p_bits_team_id, auth.uid());

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION create_team_invite_code(integer) TO authenticated;

-- ─── admin_create_bootstrap_code ─────────────────────────────────────────────
-- The Tier-1 gate: a brand-new team with no verified members yet needs one
-- admin-vetted code to found it. Bounded by number of teams, not players.
CREATE OR REPLACE FUNCTION admin_create_bootstrap_code(p_bits_team_id integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  v_code := encode(gen_random_bytes(9), 'base64');
  v_code := replace(replace(replace(v_code, '/', '_'), '+', '-'), '=', '');

  INSERT INTO invite_codes (code, code_type, scope_bits_team_id, issued_by)
  VALUES (v_code, 'new_team_bootstrap', p_bits_team_id, auth.uid());

  RETURN v_code;
END;
$$;

-- Gated on "logged in" only, same precedent as the existing admin RPCs.
GRANT EXECUTE ON FUNCTION admin_create_bootstrap_code(integer) TO authenticated;

-- ─── submit_team_claim: optional invite code → vouched, bootstrap → captain ──
DROP FUNCTION IF EXISTS submit_team_claim(integer, text);

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

  RETURN jsonb_build_object('claim_id', v_claim_id, 'status', v_status);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_team_claim(integer, text, text) TO authenticated;

-- ─── set_team_role: captain elevation gated, everything else unchanged ──────
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

  IF p_role = 'captain' AND v_claim.role != 'captain' THEN
    SELECT EXISTS (
      SELECT 1 FROM team_claims WHERE bits_team_id = p_bits_team_id AND status = 'verified' AND role = 'captain'
    ) INTO v_has_captain;

    IF v_has_captain THEN
      RAISE EXCEPTION 'captain_exists_use_transfer';
    END IF;

    -- The only self-service path to captain is a bootstrap-vouched claim
    -- (submit_team_claim already promoted those directly, so this branch is
    -- mostly a defensive no-op for them). Anyone else needs an admin nod.
    IF NOT v_claim.vouched THEN
      RAISE EXCEPTION 'captain_needs_request';
    END IF;
  END IF;

  UPDATE team_claims SET role = p_role WHERE id = v_claim.id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_team_role(integer, text) TO authenticated;

-- ─── request_captain ─────────────────────────────────────────────────────────
-- A verified member with no captain yet on their team asks for the role.
-- Surfaces in get_pending_captain_requests() for admin review.
CREATE OR REPLACE FUNCTION request_captain(p_bits_team_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim team_claims%ROWTYPE;
BEGIN
  SELECT * INTO v_claim FROM team_claims
  WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id AND status = 'verified';

  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'not_verified_member';
  END IF;

  IF EXISTS (
    SELECT 1 FROM team_claims WHERE bits_team_id = p_bits_team_id AND status = 'verified' AND role = 'captain'
  ) THEN
    RAISE EXCEPTION 'captain_exists_use_transfer';
  END IF;

  UPDATE team_claims SET captain_requested_at = now() WHERE id = v_claim.id;
END;
$$;

GRANT EXECUTE ON FUNCTION request_captain(integer) TO authenticated;

-- ─── get_pending_captain_requests ───────────────────────────────────────────
-- Admin review queue — bounded by number of teams asking, not number of
-- players. Mirrors get_pending_team_claims's shape/gating.
CREATE OR REPLACE FUNCTION get_pending_captain_requests()
RETURNS TABLE (
  claim_id             uuid,
  bits_team_id         integer,
  team_name            text,
  club_name            text,
  user_email           text,
  captain_requested_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tc.id, tc.bits_team_id, bt.name, bt.club_name, u.email::text, tc.captain_requested_at
  FROM team_claims tc
  LEFT JOIN bits_teams bt ON bt.bits_team_id = tc.bits_team_id
  LEFT JOIN auth.users u ON u.id = tc.user_id
  WHERE tc.status = 'verified' AND tc.captain_requested_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM team_claims c2
      WHERE c2.bits_team_id = tc.bits_team_id AND c2.status = 'verified' AND c2.role = 'captain'
    )
  ORDER BY tc.captain_requested_at ASC;
$$;

-- Gated on "logged in" only, same precedent as the existing admin claim-review RPCs.
GRANT EXECUTE ON FUNCTION get_pending_captain_requests() TO authenticated;

-- ─── admin_bootstrap_captain ─────────────────────────────────────────────────
-- Takes the claim id directly (same shape as update_team_claim_status) rather
-- than team+user — get_pending_captain_requests already hands back claim_id.
CREATE OR REPLACE FUNCTION admin_bootstrap_captain(p_claim_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE team_claims
  SET role = 'captain', vouched = true, captain_requested_at = NULL
  WHERE id = p_claim_id AND status = 'verified';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_verified_member';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_bootstrap_captain(uuid) TO authenticated;

-- ─── transfer_captain ────────────────────────────────────────────────────────
-- The "svenska lag" hand-off model — the current captain transfers directly,
-- we're out of the loop for every captaincy change after the founding one.
CREATE OR REPLACE FUNCTION transfer_captain(p_bits_team_id integer, p_to_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_claims
    WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id AND status = 'verified' AND role = 'captain'
  ) THEN
    RAISE EXCEPTION 'not_captain';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM team_claims
    WHERE user_id = p_to_user_id AND bits_team_id = p_bits_team_id AND status = 'verified'
  ) THEN
    RAISE EXCEPTION 'target_not_verified_member';
  END IF;

  UPDATE team_claims SET role = 'player' WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id;
  UPDATE team_claims SET role = 'captain', vouched = true WHERE user_id = p_to_user_id AND bits_team_id = p_bits_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION transfer_captain(integer, uuid) TO authenticated;

-- ─── get_verified_team_members ──────────────────────────────────────────────
-- Team-private list for the transfer-captain picker UI. Same visibility rule
-- as get_team_availability: only a verified member of the same team can call it.
CREATE OR REPLACE FUNCTION get_verified_team_members(p_bits_team_id integer)
RETURNS TABLE (user_id uuid, role text, display_name text, public_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tc.user_id, tc.role,
    COALESCE(
      CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
           ELSE bp.first_name || ' ' || bp.sur_name END,
      split_part(u.email, '@', 1)
    ) AS display_name,
    tc.matched_public_id AS public_id
  FROM team_claims tc
  LEFT JOIN bits_players bp ON bp.public_id = tc.matched_public_id
  LEFT JOIN auth.users u ON u.id = tc.user_id
  WHERE tc.bits_team_id = p_bits_team_id AND tc.status = 'verified'
    AND EXISTS (
      SELECT 1 FROM team_claims me
      WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified'
    )
  ORDER BY (tc.role = 'captain') DESC, display_name;
$$;

GRANT EXECUTE ON FUNCTION get_verified_team_members(integer) TO authenticated;

-- ─── get_team_availability: surface vouched so the UI can show a trust badge ─
-- Same query as team_availability.sql, plus a.vouched → tc.vouched. Not a new
-- table, just a richer view onto the same data.
CREATE OR REPLACE FUNCTION get_team_availability(p_bits_team_id integer, p_bits_match_id integer)
RETURNS TABLE (
  user_id      uuid,
  response     text,
  note         text,
  responded_at timestamptz,
  display_name text,
  public_id    uuid,
  vouched      boolean
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
    tc.matched_public_id AS public_id,
    tc.vouched
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
