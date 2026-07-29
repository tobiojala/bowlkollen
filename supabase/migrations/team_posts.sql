-- Notis central Phase 1: a team's private message board ("Anslagstavla"). Captains +
-- board (lagledare/styrelse) post; every verified member reads and sees "what's new"
-- via unread tracking. Team-private — RLS scopes reads to members; writes go only
-- through the role-checked RPC. Polls/reactions come in later phases.
--
-- NOTE: named team_board_* (not team_posts) because a legacy, empty `team_posts` table
-- with a different schema (team_id/content) already exists in the DB. We leave that one
-- alone. The RPC names are unchanged, so the app needs no changes.

CREATE TABLE IF NOT EXISTS public.team_board_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bits_team_id     integer NOT NULL,
  author_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text CHECK (title IS NULL OR char_length(title) <= 140),
  body             text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),  -- ~500 words
  kind             text NOT NULL DEFAULT 'message' CHECK (kind IN ('message', 'poll')),
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS team_board_posts_team_idx ON public.team_board_posts (bits_team_id, created_at DESC);

ALTER TABLE public.team_board_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_board_posts_read ON public.team_board_posts;
CREATE POLICY team_board_posts_read ON public.team_board_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_claims tc WHERE tc.user_id = auth.uid() AND tc.bits_team_id = team_board_posts.bits_team_id AND tc.status = 'verified')
);

-- Per-member "last seen" marker → drives the unread badge.
CREATE TABLE IF NOT EXISTS public.team_board_seen (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bits_team_id integer NOT NULL,
  seen_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bits_team_id)
);
ALTER TABLE public.team_board_seen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_board_seen_own ON public.team_board_seen;
CREATE POLICY team_board_seen_own ON public.team_board_seen FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── create_team_post ────────────────────────────────────────────────────────
-- Captain / lagledare / styrelse only.
CREATE OR REPLACE FUNCTION public.create_team_post(p_bits_team_id integer, p_title text, p_body text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_claims
    WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id AND status = 'verified'
      AND role IN ('captain', 'lagledare', 'styrelse')
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF p_body IS NULL OR char_length(trim(p_body)) = 0 THEN RAISE EXCEPTION 'empty_body'; END IF;

  INSERT INTO team_board_posts (bits_team_id, author_user_id, title, body)
  VALUES (p_bits_team_id, auth.uid(), nullif(trim(p_title), ''), trim(p_body))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_team_post(integer, text, text) TO authenticated;

-- ─── get_team_posts ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_team_posts(p_bits_team_id integer)
RETURNS TABLE (id uuid, title text, body text, created_at timestamptz, author_name text, is_mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id, p.title, p.body, p.created_at,
    COALESCE(
      CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name ELSE bp.first_name || ' ' || bp.sur_name END,
      split_part(u.email, '@', 1)
    ) AS author_name,
    (p.author_user_id = auth.uid()) AS is_mine
  FROM team_board_posts p
  LEFT JOIN team_claims tc ON tc.user_id = p.author_user_id AND tc.bits_team_id = p.bits_team_id AND tc.status = 'verified'
  LEFT JOIN bits_players bp ON bp.public_id = tc.matched_public_id
  LEFT JOIN auth.users u ON u.id = p.author_user_id
  WHERE p.bits_team_id = p_bits_team_id
    AND EXISTS (SELECT 1 FROM team_claims me WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified')
  ORDER BY p.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_team_posts(integer) TO authenticated;

-- ─── mark_team_posts_seen ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_team_posts_seen(p_bits_team_id integer)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO team_board_seen (user_id, bits_team_id, seen_at)
  VALUES (auth.uid(), p_bits_team_id, now())
  ON CONFLICT (user_id, bits_team_id) DO UPDATE SET seen_at = now();
$$;
GRANT EXECUTE ON FUNCTION public.mark_team_posts_seen(integer) TO authenticated;

-- ─── get_my_unread_posts ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_unread_posts()
RETURNS TABLE (bits_team_id integer, unread integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tc.bits_team_id, count(p.id)::int AS unread
  FROM team_claims tc
  LEFT JOIN team_board_seen s ON s.user_id = tc.user_id AND s.bits_team_id = tc.bits_team_id
  LEFT JOIN team_board_posts p ON p.bits_team_id = tc.bits_team_id
        AND p.created_at > COALESCE(s.seen_at, '1970-01-01'::timestamptz)
        AND p.author_user_id <> auth.uid()
  WHERE tc.user_id = auth.uid() AND tc.status = 'verified'
  GROUP BY tc.bits_team_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_unread_posts() TO authenticated;
