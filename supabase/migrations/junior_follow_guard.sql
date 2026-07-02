-- Junior guardrail: "junior profiles public, no social until claimed" was
-- locked as policy in LAUNCH_PLAN.md (2026-06-13) but never built — fine
-- while nobody had real access, not fine once invite codes go out. This
-- enforces it at the DB level (a trigger on `follows`, not just hidden UI),
-- and adds the one missing piece that makes "until claimed" reachable at
-- all: nothing in the app today ever sets player_claims.status = 'verified'.

ALTER TABLE player_claims DROP CONSTRAINT IF EXISTS player_claims_status_check;
ALTER TABLE player_claims
  ADD CONSTRAINT player_claims_status_check CHECK (status IN ('pending', 'verified', 'rejected'));

-- ─── get_player_identity: add is_claimed ──────────────────────────────────
-- DROP+CREATE since CREATE OR REPLACE can't change return columns (same as
-- the earlier is_junior addition).
DROP FUNCTION IF EXISTS get_player_identity(uuid);

CREATE FUNCTION get_player_identity(p_public_id uuid)
RETURNS TABLE (
  public_id         uuid,
  name              text,
  club_name         text,
  licence_average   integer,
  licence_skill_lvl integer,
  is_junior         boolean,
  is_claimed        boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bp.public_id,
    CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
         ELSE bp.first_name || ' ' || bp.sur_name END AS name,
    bp.club_name,
    bp.licence_average,
    bp.licence_skill_lvl,
    bits_player_is_junior(bp.lic_nbr) AS is_junior,
    EXISTS (
      SELECT 1 FROM player_claims pc
      WHERE pc.player_id = bp.public_id AND pc.status = 'verified'
    ) AS is_claimed
  FROM bits_players bp
  WHERE bp.public_id = p_public_id;
$$;

GRANT EXECUTE ON FUNCTION get_player_identity(uuid) TO anon, authenticated;

-- ─── trigger: block following an unclaimed junior ──────────────────────────
-- Only blocks INSERT — unfollowing (DELETE) is never gated.
CREATE OR REPLACE FUNCTION enforce_junior_follow_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lic_nbr text;
BEGIN
  IF NEW.entity_type != 'player' THEN
    RETURN NEW;
  END IF;

  SELECT lic_nbr INTO v_lic_nbr FROM bits_players WHERE public_id = NEW.entity_id::uuid;
  IF v_lic_nbr IS NULL OR NOT bits_player_is_junior(v_lic_nbr) THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM player_claims
    WHERE player_id = NEW.entity_id::uuid AND status = 'verified'
  ) THEN
    RAISE EXCEPTION 'junior_unclaimed: cannot follow an unclaimed junior player';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_junior_guard ON follows;

CREATE TRIGGER on_follow_junior_guard
  BEFORE INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION enforce_junior_follow_guard();

-- ─── admin claim review (minimal — no automation, see LAUNCH_PLAN.md) ─────
CREATE OR REPLACE FUNCTION get_pending_claims()
RETURNS TABLE (
  claim_id    uuid,
  public_id   uuid,
  player_name text,
  club_name   text,
  claimed_at  timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pc.id,
    bp.public_id,
    CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
         ELSE bp.first_name || ' ' || bp.sur_name END AS player_name,
    bp.club_name,
    pc.claimed_at
  FROM player_claims pc
  JOIN bits_players bp ON bp.public_id = pc.player_id
  WHERE pc.status = 'pending'
  ORDER BY pc.claimed_at ASC;
$$;

CREATE OR REPLACE FUNCTION update_claim_status(p_claim_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('verified', 'rejected') THEN
    RAISE EXCEPTION 'invalid status: %', p_status;
  END IF;

  UPDATE player_claims
  SET status = p_status, verified_at = CASE WHEN p_status = 'verified' THEN now() ELSE verified_at END
  WHERE id = p_claim_id;
END;
$$;

-- Gated on "logged in" only, same as /admin/players today — no new role check.
GRANT EXECUTE ON FUNCTION get_pending_claims()             TO authenticated;
GRANT EXECUTE ON FUNCTION update_claim_status(uuid, text)  TO authenticated;
