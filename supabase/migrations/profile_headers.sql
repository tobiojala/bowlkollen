-- Public curated headers: a claimed player and a team can pick a cover colour for their
-- PUBLIC profile/team page. Curated colour only (no arbitrary photos) → nothing to
-- moderate. Public read; writes gated to the owner (the claimer / the captain-board).

-- ── player ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_appearance (
  public_id    uuid PRIMARY KEY,
  header_color text CHECK (header_color IS NULL OR header_color ~ '^#[0-9a-fA-F]{6}$'),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.player_appearance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS player_appearance_read ON public.player_appearance;
CREATE POLICY player_appearance_read ON public.player_appearance FOR SELECT USING (true);
GRANT SELECT ON public.player_appearance TO anon, authenticated;

-- The caller sets the header on THEIR claimed player.
CREATE OR REPLACE FUNCTION public.set_my_player_header(p_color text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pid uuid;
BEGIN
  SELECT player_id INTO v_pid FROM player_claims WHERE user_id = auth.uid() AND status = 'verified' LIMIT 1;
  IF v_pid IS NULL THEN RAISE EXCEPTION 'no_claim'; END IF;
  IF p_color IS NOT NULL AND p_color !~ '^#[0-9a-fA-F]{6}$' THEN RAISE EXCEPTION 'bad_color'; END IF;
  INSERT INTO player_appearance (public_id, header_color, updated_at)
  VALUES (v_pid, p_color, now())
  ON CONFLICT (public_id) DO UPDATE SET header_color = excluded.header_color, updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_my_player_header(text) TO authenticated;

-- ── team (extend team_appearance) ────────────────────────────────────────────
ALTER TABLE public.team_appearance ADD COLUMN IF NOT EXISTS header_color text
  CHECK (header_color IS NULL OR header_color ~ '^#[0-9a-fA-F]{6}$');

CREATE OR REPLACE FUNCTION public.set_team_header(p_bits_team_id integer, p_color text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_claims WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id
      AND status = 'verified' AND role IN ('captain', 'lagledare', 'styrelse')
  ) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF p_color IS NOT NULL AND p_color !~ '^#[0-9a-fA-F]{6}$' THEN RAISE EXCEPTION 'bad_color'; END IF;
  INSERT INTO team_appearance (bits_team_id, header_color, updated_at)
  VALUES (p_bits_team_id, p_color, now())
  ON CONFLICT (bits_team_id) DO UPDATE SET header_color = excluded.header_color, updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_team_header(integer, text) TO authenticated;
