-- Junior detection, for the new onboarding/anon-view-suggestion surfaces.
-- Swedish bowling licence numbers encode the birthdate: first char is
-- gender (K/M), next 6 digits are DDMMYY (verified against live data —
-- e.g. lic_nbr 'K010109EMI01' = born 2009-01-01). This derives a boolean
-- only — the actual birthdate/lic_nbr never leaves this function, matching
-- the existing "lic_nbr never shown in any UI" rule (bits_players.sql:2).
--
-- Cutoff is intentionally conservative (under 18) for the narrow purpose of
-- excluding junior players from social/suggestion surfaces per the locked
-- launch policy ("junior profiles public, no social until claimed") — this
-- is not necessarily SvBF's own "junior division" age band, which may
-- differ. Confirm with the user before relying on this for anything beyond
-- that narrow exclusion.
CREATE OR REPLACE FUNCTION bits_player_is_junior(p_lic_nbr text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  dd  int;
  mm  int;
  yy  int;
  century int;
  birth_date date;
BEGIN
  IF p_lic_nbr IS NULL OR p_lic_nbr !~ '^[KM][0-9]{6}' THEN
    RETURN false;
  END IF;

  dd := substring(p_lic_nbr from 2 for 2)::int;
  mm := substring(p_lic_nbr from 4 for 2)::int;
  yy := substring(p_lic_nbr from 6 for 2)::int;
  century := CASE WHEN yy <= (extract(year from current_date)::int % 100) THEN 2000 ELSE 1900 END;

  BEGIN
    birth_date := make_date(century + yy, mm, dd);
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  RETURN birth_date > (current_date - interval '18 years');
END;
$$;

-- Rebuild get_player_identity with is_junior added — DROP first since
-- CREATE OR REPLACE can't change an existing function's return columns.
DROP FUNCTION IF EXISTS get_player_identity(uuid);

CREATE FUNCTION get_player_identity(p_public_id uuid)
RETURNS TABLE (
  public_id         uuid,
  name              text,
  club_name         text,
  licence_average   integer,
  licence_skill_lvl integer,
  is_junior         boolean
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
    bits_player_is_junior(bp.lic_nbr) AS is_junior
  FROM bits_players bp
  WHERE bp.public_id = p_public_id;
$$;

GRANT EXECUTE ON FUNCTION get_player_identity(uuid) TO anon, authenticated;
