-- Notis central Phase 2: polls on the team board. A post can be a poll (options +
-- one vote per member, live results). Reuses team_board_posts (see team_posts.sql —
-- named team_board_* to avoid the legacy empty `team_posts` table).

ALTER TABLE public.team_board_posts ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'message'
  CHECK (kind IN ('message', 'poll'));

CREATE TABLE IF NOT EXISTS public.team_board_options (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES team_board_posts(id) ON DELETE CASCADE,
  label   text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 140),
  sort    integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS team_board_options_post_idx ON public.team_board_options (post_id, sort);

CREATE TABLE IF NOT EXISTS public.team_board_votes (
  post_id   uuid NOT NULL REFERENCES team_board_posts(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES team_board_options(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)   -- one vote per member per poll
);

ALTER TABLE public.team_board_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_board_votes   ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_board_votes_own ON public.team_board_votes;
CREATE POLICY team_board_votes_own ON public.team_board_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── create_team_poll ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_team_poll(p_bits_team_id integer, p_title text, p_body text, p_options jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_opt text; v_i int := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_claims WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id
      AND status = 'verified' AND role IN ('captain', 'lagledare', 'styrelse')
  ) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF jsonb_array_length(p_options) < 2 THEN RAISE EXCEPTION 'need_two_options'; END IF;

  INSERT INTO team_board_posts (bits_team_id, author_user_id, title, body, kind)
  VALUES (p_bits_team_id, auth.uid(), nullif(trim(p_title), ''), trim(p_body), 'poll')
  RETURNING id INTO v_id;

  FOR v_opt IN SELECT jsonb_array_elements_text(p_options) LOOP
    IF length(trim(v_opt)) > 0 THEN
      INSERT INTO team_board_options (post_id, label, sort) VALUES (v_id, trim(v_opt), v_i);
      v_i := v_i + 1;
    END IF;
  END LOOP;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_team_poll(integer, text, text, jsonb) TO authenticated;

-- ─── vote_team_post ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vote_team_post(p_post_id uuid, p_option_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_team integer;
BEGIN
  SELECT bits_team_id INTO v_team FROM team_board_posts WHERE id = p_post_id;
  IF v_team IS NULL THEN RAISE EXCEPTION 'no_post'; END IF;
  IF NOT EXISTS (SELECT 1 FROM team_claims WHERE user_id = auth.uid() AND bits_team_id = v_team AND status = 'verified') THEN
    RAISE EXCEPTION 'not_member';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM team_board_options WHERE id = p_option_id AND post_id = p_post_id) THEN
    RAISE EXCEPTION 'bad_option';
  END IF;

  INSERT INTO team_board_votes (post_id, option_id, user_id)
  VALUES (p_post_id, p_option_id, auth.uid())
  ON CONFLICT (post_id, user_id) DO UPDATE SET option_id = excluded.option_id, voted_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.vote_team_post(uuid, uuid) TO authenticated;

-- ─── get_team_posts: now returns kind + poll options with live counts ────────
DROP FUNCTION IF EXISTS public.get_team_posts(integer);
CREATE FUNCTION public.get_team_posts(p_bits_team_id integer)
RETURNS TABLE (id uuid, kind text, title text, body text, created_at timestamptz, author_name text, is_mine boolean, options jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id, p.kind, p.title, p.body, p.created_at,
    COALESCE(
      CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name ELSE bp.first_name || ' ' || bp.sur_name END,
      split_part(u.email, '@', 1)
    ) AS author_name,
    (p.author_user_id = auth.uid()) AS is_mine,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', o.id, 'label', o.label,
        'votes', (SELECT count(*) FROM team_board_votes v WHERE v.option_id = o.id),
        'mine', EXISTS (SELECT 1 FROM team_board_votes v2 WHERE v2.option_id = o.id AND v2.user_id = auth.uid())
      ) ORDER BY o.sort)
      FROM team_board_options o WHERE o.post_id = p.id
    ), '[]'::jsonb) AS options
  FROM team_board_posts p
  LEFT JOIN team_claims tc ON tc.user_id = p.author_user_id AND tc.bits_team_id = p.bits_team_id AND tc.status = 'verified'
  LEFT JOIN bits_players bp ON bp.public_id = tc.matched_public_id
  LEFT JOIN auth.users u ON u.id = p.author_user_id
  WHERE p.bits_team_id = p_bits_team_id
    AND EXISTS (SELECT 1 FROM team_claims me WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified')
  ORDER BY p.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_team_posts(integer) TO authenticated;
