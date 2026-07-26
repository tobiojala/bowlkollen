-- Captain back office: list the squad, and let a captain assign roles. Roles are a
-- team decision — captains manage them; nobody self-promotes to captain (that was
-- the hole). Adds 'styrelse' (board) to the role set.

-- ─── roles: add 'styrelse' ───────────────────────────────────────────────────
ALTER TABLE public.team_claims DROP CONSTRAINT IF EXISTS team_claims_role_check;
ALTER TABLE public.team_claims ADD CONSTRAINT team_claims_role_check
  CHECK (role IN ('player', 'captain', 'lagledare', 'styrelse', 'reserv'));

-- ─── get_team_members ────────────────────────────────────────────────────────
-- Team-private: only a verified member sees the roster of accounts + roles.
CREATE OR REPLACE FUNCTION public.get_team_members(p_bits_team_id integer)
RETURNS TABLE (
  user_id      uuid,
  display_name text,
  public_id    uuid,
  role         text,
  vouched      boolean,
  is_me        boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tc.user_id,
    COALESCE(
      CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
           ELSE bp.first_name || ' ' || bp.sur_name END,
      split_part(u.email, '@', 1)
    ) AS display_name,
    tc.matched_public_id AS public_id,
    tc.role,
    tc.vouched,
    (tc.user_id = auth.uid()) AS is_me
  FROM team_claims tc
  LEFT JOIN bits_players bp ON bp.public_id = tc.matched_public_id
  LEFT JOIN auth.users u ON u.id = tc.user_id
  WHERE tc.bits_team_id = p_bits_team_id AND tc.status = 'verified'
    AND EXISTS (
      SELECT 1 FROM team_claims me
      WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified'
    )
  ORDER BY (tc.role = 'captain') DESC, display_name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_members(integer) TO authenticated;

-- ─── set_member_role ─────────────────────────────────────────────────────────
-- Captain-only. Assigns any team role to a verified member (multiple captains are
-- fine). Guard: never demote the last captain — a team must always keep one.
CREATE OR REPLACE FUNCTION public.set_member_role(p_bits_team_id integer, p_target_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_role   text;
  v_captain_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_claims
    WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id AND status = 'verified' AND role = 'captain'
  ) THEN
    RAISE EXCEPTION 'not_captain';
  END IF;
  IF p_role NOT IN ('player', 'captain', 'lagledare', 'styrelse', 'reserv') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  SELECT role INTO v_target_role FROM team_claims
   WHERE user_id = p_target_user_id AND bits_team_id = p_bits_team_id AND status = 'verified';
  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  -- Don't leave the team captain-less.
  IF v_target_role = 'captain' AND p_role <> 'captain' THEN
    SELECT count(*) INTO v_captain_count FROM team_claims
     WHERE bits_team_id = p_bits_team_id AND status = 'verified' AND role = 'captain';
    IF v_captain_count <= 1 THEN
      RAISE EXCEPTION 'last_captain';
    END IF;
  END IF;

  UPDATE team_claims SET role = p_role
   WHERE user_id = p_target_user_id AND bits_team_id = p_bits_team_id AND status = 'verified';
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_member_role(integer, uuid, text) TO authenticated;

-- ─── harden set_team_role ────────────────────────────────────────────────────
-- A member may self-declare a non-privileged role, but NEVER captain — captaincy
-- comes only from a bootstrap/admin invite or a sitting captain (set_member_role).
CREATE OR REPLACE FUNCTION public.set_team_role(p_bits_team_id integer, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_role NOT IN ('player', 'lagledare', 'styrelse', 'reserv') THEN
    RAISE EXCEPTION 'invalid_role';   -- 'captain' is intentionally excluded here
  END IF;

  UPDATE team_claims SET role = p_role
   WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id AND status = 'verified';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_verified_member';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_team_role(integer, text) TO authenticated;
