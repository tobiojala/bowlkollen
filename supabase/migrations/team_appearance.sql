-- Per-team appearance: a captain-chosen ring colour to match the club's logo. Public
-- read (it's team branding everyone sees); writes are captain/board only.

CREATE TABLE IF NOT EXISTS public.team_appearance (
  bits_team_id integer PRIMARY KEY,
  ring_color   text CHECK (ring_color IS NULL OR ring_color ~ '^#[0-9a-fA-F]{6}$'),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_appearance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_appearance_read ON public.team_appearance;
CREATE POLICY team_appearance_read ON public.team_appearance FOR SELECT USING (true);
GRANT SELECT ON public.team_appearance TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_team_color(p_bits_team_id integer, p_ring_color text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM team_claims WHERE user_id = auth.uid() AND bits_team_id = p_bits_team_id
      AND status = 'verified' AND role IN ('captain', 'lagledare', 'styrelse')
  ) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF p_ring_color IS NOT NULL AND p_ring_color !~ '^#[0-9a-fA-F]{6}$' THEN RAISE EXCEPTION 'bad_color'; END IF;

  INSERT INTO team_appearance (bits_team_id, ring_color, updated_at)
  VALUES (p_bits_team_id, p_ring_color, now())
  ON CONFLICT (bits_team_id) DO UPDATE SET ring_color = excluded.ring_color, updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_team_color(integer, text) TO authenticated;
