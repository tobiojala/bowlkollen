-- Which players have a VERIFIED claim → the "on Bowlkollen" badge. Reveals only
-- claimed-or-not for the ids you ask about (social proof), never the user identity
-- behind the claim. player_claims itself stays RLS-private; this is the one public
-- projection of it.

CREATE OR REPLACE FUNCTION public.get_claimed_public_ids(p_ids uuid[])
RETURNS TABLE (public_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pc.player_id
  FROM player_claims pc
  WHERE pc.status = 'verified' AND pc.player_id = ANY(p_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_claimed_public_ids(uuid[]) TO anon, authenticated;
