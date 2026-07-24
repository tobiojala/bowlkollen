-- Soft-launch invite links that actually work: a valid team-scoped code is now
-- SUFFICIENT to verify team membership (full auto-join), independent of the
-- roster/club auto-match — which is dead for pre-season teams and clubs whose
-- agreement_club_id is unpopulated. This is the wire invite_scoped_claims.sql
-- left unconnected (a code only set `vouched`, never `verified`).
--
-- Two producers of team codes:
--   • admin_create_member_invite / admin_bulk_member_invites — the curated
--     soft-launch list (person → team, one-time, optionally captain). is_admin()-gated.
--   • create_team_invite_code (existing) — a verified member's shareable team link
--     to bring teammates in (the share IS the vouch), multi-use.
-- One consumer: redeem_team_invite(code) — called by the native app after login.

-- ─── invite_codes: usage limits + granted role ───────────────────────────────
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS max_uses   integer;              -- null = unlimited
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS grants_role text NOT NULL DEFAULT 'player';
ALTER TABLE public.invite_codes DROP CONSTRAINT IF EXISTS invite_codes_grants_role_check;
ALTER TABLE public.invite_codes ADD CONSTRAINT invite_codes_grants_role_check
  CHECK (grants_role IN ('player', 'captain'));

-- 'team_member' = an admin-issued, full-auto per-person team code.
ALTER TABLE public.invite_codes DROP CONSTRAINT IF EXISTS invite_codes_code_type_check;
ALTER TABLE public.invite_codes ADD CONSTRAINT invite_codes_code_type_check
  CHECK (code_type IN ('site_access', 'team_claim', 'new_team_bootstrap', 'team_member'));

-- ─── redeem_team_invite ──────────────────────────────────────────────────────
-- The redeemer becomes a VERIFIED member of the code's team. The vouch is trusted
-- by type: admin-issued (team_member / new_team_bootstrap) is trusted outright; a
-- member-issued (team_claim) is re-checked live so a since-removed member's links
-- stop working. Never downgrades an existing captain.
CREATE OR REPLACE FUNCTION public.redeem_team_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code       invite_codes%ROWTYPE;
  v_grant_role text;
  v_claim_id   uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_code FROM invite_codes WHERE code = p_code AND is_active = true;
  IF v_code.id IS NULL OR v_code.scope_bits_team_id IS NULL
     OR v_code.code_type NOT IN ('team_claim', 'new_team_bootstrap', 'team_member') THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  IF v_code.max_uses IS NOT NULL AND v_code.used_count >= v_code.max_uses THEN
    RAISE EXCEPTION 'code_exhausted';
  END IF;

  -- Member-issued codes are only valid while the issuer is still a verified member.
  IF v_code.code_type = 'team_claim' AND NOT EXISTS (
    SELECT 1 FROM team_claims
    WHERE user_id = v_code.issued_by AND bits_team_id = v_code.scope_bits_team_id AND status = 'verified'
  ) THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  v_grant_role := CASE WHEN v_code.code_type = 'new_team_bootstrap' THEN 'captain' ELSE v_code.grants_role END;

  INSERT INTO team_claims (user_id, bits_team_id, status, role, claimed_at, verified_at, vouched)
  VALUES (auth.uid(), v_code.scope_bits_team_id, 'verified', v_grant_role, now(), now(), true)
  ON CONFLICT (user_id, bits_team_id) DO UPDATE
    SET status = 'verified',
        verified_at = now(),
        vouched = true,
        -- promote to captain if the code grants it; otherwise never demote.
        role = CASE WHEN v_grant_role = 'captain' THEN 'captain' ELSE team_claims.role END
  RETURNING id INTO v_claim_id;

  UPDATE invite_codes
     SET used_count = used_count + 1,
         is_active  = CASE WHEN max_uses IS NOT NULL AND used_count + 1 >= max_uses THEN false ELSE is_active END
   WHERE id = v_code.id;

  RETURN jsonb_build_object('bits_team_id', v_code.scope_bits_team_id, 'role', v_grant_role, 'status', 'verified');
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_team_invite(text) TO authenticated;

-- ─── admin_create_member_invite ──────────────────────────────────────────────
-- One curated, one-time (default) per-person team code. p_role='captain' flags the
-- captains in your list. is_admin()-gated.
CREATE OR REPLACE FUNCTION public.admin_create_member_invite(
  p_bits_team_id integer,
  p_invitee_name text,
  p_role text DEFAULT 'player',
  p_max_uses integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin';
  END IF;
  IF p_role NOT IN ('player', 'captain') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bits_teams WHERE bits_team_id = p_bits_team_id) THEN
    RAISE EXCEPTION 'team_not_found';
  END IF;

  v_code := replace(replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-'), '=', '');

  INSERT INTO invite_codes (code, code_type, scope_bits_team_id, issued_by, invitee_name, grants_role, max_uses)
  VALUES (v_code, 'team_member', p_bits_team_id, auth.uid(), p_invitee_name, p_role, p_max_uses);

  RETURN jsonb_build_object('code', v_code, 'invitee_name', p_invitee_name, 'bits_team_id', p_bits_team_id, 'role', p_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_member_invite(integer, text, text, integer) TO authenticated;

-- ─── admin_bulk_member_invites ───────────────────────────────────────────────
-- Feed your whole soft-launch list at once. Input: a JSON array of
-- {bits_team_id, invitee_name, role?}. Returns one code per row to paste into links.
CREATE OR REPLACE FUNCTION public.admin_bulk_member_invites(p_rows jsonb)
RETURNS TABLE (code text, invitee_name text, bits_team_id integer, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    code         := replace(replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-'), '=', '');
    invitee_name := r->>'invitee_name';
    bits_team_id := (r->>'bits_team_id')::integer;
    role         := COALESCE(r->>'role', 'player');
    IF role NOT IN ('player', 'captain') THEN role := 'player'; END IF;

    INSERT INTO invite_codes (code, code_type, scope_bits_team_id, issued_by, invitee_name, grants_role, max_uses)
    VALUES (code, 'team_member', bits_team_id, auth.uid(), invitee_name, role, 1);

    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_bulk_member_invites(jsonb) TO authenticated;

-- ─── harden admin_create_bootstrap_code ──────────────────────────────────────
-- It mints captain-granting codes and was gated only on "logged in". Require admin.
CREATE OR REPLACE FUNCTION public.admin_create_bootstrap_code(p_bits_team_id integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  v_code := replace(replace(replace(encode(gen_random_bytes(9), 'base64'), '/', '_'), '+', '-'), '=', '');

  INSERT INTO invite_codes (code, code_type, scope_bits_team_id, issued_by)
  VALUES (v_code, 'new_team_bootstrap', p_bits_team_id, auth.uid());

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_bootstrap_code(integer) TO authenticated;
