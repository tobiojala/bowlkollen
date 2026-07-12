-- Admin review surface for pending team claims (mirrors the player-claim pair
-- get_pending_claims / update_claim_status in junior_follow_guard.sql).
--
-- Unlike player claims there is no name to match against — the license number
-- is not stored on the claim — so the admin judges on who (email) claims to
-- belong to which team. Reviewed at /admin/claims.

CREATE OR REPLACE FUNCTION get_pending_team_claims()
RETURNS TABLE (
  claim_id     uuid,
  bits_team_id integer,
  team_name    text,
  club_name    text,
  user_email   text,
  claimed_at   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tc.id,
    tc.bits_team_id,
    bt.name,
    bt.club_name,
    u.email::text,
    tc.claimed_at
  FROM team_claims tc
  LEFT JOIN bits_teams bt ON bt.bits_team_id = tc.bits_team_id
  LEFT JOIN auth.users u ON u.id = tc.user_id
  WHERE tc.status = 'pending'
  ORDER BY tc.claimed_at ASC;
$$;

CREATE OR REPLACE FUNCTION update_team_claim_status(p_claim_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('verified', 'rejected') THEN
    RAISE EXCEPTION 'invalid status: %', p_status;
  END IF;

  UPDATE team_claims
  SET status = p_status, verified_at = CASE WHEN p_status = 'verified' THEN now() ELSE verified_at END
  WHERE id = p_claim_id;
END;
$$;

-- Gated on "logged in" only, same as the player-claim review functions.
GRANT EXECUTE ON FUNCTION get_pending_team_claims()             TO authenticated;
GRANT EXECUTE ON FUNCTION update_team_claim_status(uuid, text)  TO authenticated;
