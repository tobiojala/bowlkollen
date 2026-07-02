-- Anonymous pre-signup view tracking, for the soft-launch onboarding flow.
-- Most signups during an invite-only launch arrive via "a teammate sent me a
-- link to their profile" — this captures that one specific page so the
-- onboarding screen can offer "you looked at X — follow them?" instead of
-- guessing from population data with near-zero usage density. Anonymous,
-- short-lived, deleted as soon as it's consumed at signup (data minimization
-- — see /legal for the disclosure).

CREATE TABLE IF NOT EXISTS anon_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id     uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('player', 'team')),
  entity_id   text NOT NULL,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anon_views_anon_id_idx ON anon_views (anon_id, viewed_at DESC);

ALTER TABLE anon_views ENABLE ROW LEVEL SECURITY;

-- Anyone can record a view (no auth context exists pre-signup). No direct
-- SELECT policy — reads only happen through get_anon_view_suggestions below,
-- so no client can browse another anon_id's history.
DROP POLICY IF EXISTS "anyone can insert anon views" ON anon_views;
CREATE POLICY "anyone can insert anon views" ON anon_views
  FOR INSERT WITH CHECK (true);

-- ─── get_anon_view_suggestions ────────────────────────────────────────────
-- Most-recent distinct entities this device viewed in the last 30 days,
-- excluding any player who resolves as a junior (see bits_player_public_id
-- migration's get_player_identity.is_junior — junior profiles stay public
-- but are excluded from social/suggestion surfaces until claimed, per the
-- locked launch policy).
CREATE OR REPLACE FUNCTION get_anon_view_suggestions(p_anon_id uuid)
RETURNS TABLE (
  entity_type text,
  entity_id   text,
  viewed_at   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.entity_type, v.entity_id, max(v.viewed_at) AS viewed_at
  FROM anon_views v
  WHERE v.anon_id = p_anon_id
    AND v.viewed_at > now() - interval '30 days'
    AND NOT (
      v.entity_type = 'player'
      AND EXISTS (
        SELECT 1 FROM bits_players bp
        WHERE bp.public_id::text = v.entity_id AND bits_player_is_junior(bp.lic_nbr)
      )
    )
  GROUP BY v.entity_type, v.entity_id
  ORDER BY viewed_at DESC
  LIMIT 8;
$$;

-- ─── delete_anon_views ─────────────────────────────────────────────────────
-- Called by the onboarding screen right after it consumes the suggestions —
-- anonymous history has no reason to outlive the signup it informed.
CREATE OR REPLACE FUNCTION delete_anon_views(p_anon_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM anon_views WHERE anon_id = p_anon_id;
$$;

GRANT EXECUTE ON FUNCTION get_anon_view_suggestions(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_anon_views(uuid)          TO anon, authenticated;
