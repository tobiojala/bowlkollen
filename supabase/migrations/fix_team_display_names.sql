-- Team member / availability names were falling back to the email prefix whenever
-- a user's team membership (team_claims.matched_public_id) wasn't linked to their
-- player — even though player_claims already holds their verified player identity.
-- Resolve the display name AND the profile link via player_claims as a fallback, so
-- the real profile name always shows and tapping a member always opens their profile.
--
-- Effective player id = COALESCE(team_claims.matched_public_id, player_claims.player_id).
-- Signatures are unchanged from the live versions (get_team_members: +vouched, is_me;
-- get_team_availability: +responded_at, vouched) — DROP+CREATE to replace cleanly.

DROP FUNCTION IF EXISTS get_team_members(integer);
CREATE FUNCTION get_team_members(p_bits_team_id integer)
RETURNS TABLE (user_id uuid, display_name text, public_id uuid, role text, vouched boolean, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    tc.user_id,
    COALESCE(
      CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
           ELSE bp.first_name || ' ' || bp.sur_name END,
      split_part(u.email, '@', 1)
    ) AS display_name,
    COALESCE(tc.matched_public_id, pc.player_id) AS public_id,
    tc.role,
    tc.vouched,
    (tc.user_id = auth.uid()) AS is_me
  FROM team_claims tc
  LEFT JOIN player_claims pc ON pc.user_id = tc.user_id AND pc.status = 'verified'
  LEFT JOIN bits_players bp ON bp.public_id = COALESCE(tc.matched_public_id, pc.player_id)
  LEFT JOIN auth.users u ON u.id = tc.user_id
  WHERE tc.bits_team_id = p_bits_team_id AND tc.status = 'verified'
    AND EXISTS (
      SELECT 1 FROM team_claims me
      WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified'
    )
  ORDER BY (tc.role = 'captain') DESC, display_name ASC;
$$;
GRANT EXECUTE ON FUNCTION get_team_members(integer) TO authenticated;

DROP FUNCTION IF EXISTS get_team_availability(integer, integer);
CREATE FUNCTION get_team_availability(p_bits_team_id integer, p_bits_match_id integer)
RETURNS TABLE (user_id uuid, response text, note text, responded_at timestamptz, display_name text, public_id uuid, vouched boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    a.user_id, a.response, a.note, a.responded_at,
    COALESCE(
      CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
           ELSE bp.first_name || ' ' || bp.sur_name END,
      split_part(u.email, '@', 1)
    ) AS display_name,
    COALESCE(tc.matched_public_id, pc.player_id) AS public_id,
    tc.vouched
  FROM team_match_availability a
  JOIN team_claims tc ON tc.user_id = a.user_id AND tc.bits_team_id = a.bits_team_id AND tc.status = 'verified'
  LEFT JOIN player_claims pc ON pc.user_id = a.user_id AND pc.status = 'verified'
  LEFT JOIN bits_players bp ON bp.public_id = COALESCE(tc.matched_public_id, pc.player_id)
  LEFT JOIN auth.users u ON u.id = a.user_id
  WHERE a.bits_team_id = p_bits_team_id AND a.bits_match_id = p_bits_match_id
    AND EXISTS (
      SELECT 1 FROM team_claims me
      WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified'
    )
  ORDER BY a.responded_at ASC;
$$;
GRANT EXECUTE ON FUNCTION get_team_availability(integer, integer) TO authenticated;
