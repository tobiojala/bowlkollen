-- Soft-launch invite gating. Two small tables, managed by hand via the SQL
-- editor as players are invited — no admin UI, matching the existing
-- "manual claim approval, no automation" precedent at this cohort scale
-- (see LAUNCH_PLAN.md). No RLS read/write grants to anon/authenticated on
-- either table — everything goes through validate_and_redeem_invite_code,
-- same locked-down pattern as the player identity functions.

CREATE TABLE IF NOT EXISTS invite_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text UNIQUE NOT NULL,
  invitee_name text,
  is_active    boolean NOT NULL DEFAULT true,
  click_count  integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- One row per *signup* attributed to a code (clicking the link only sets a
-- cookie via invite_codes.click_count — this is the actual "who invited
-- whom" log, written once at first sign-in).
CREATE TABLE IF NOT EXISTS invite_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL,
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invite_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_redemptions ENABLE ROW LEVEL SECURITY;
-- No policies added — both tables are fully inaccessible to anon/authenticated
-- directly; access is only via the SECURITY DEFINER function below plus
-- direct SQL-editor/service-role access for you.

CREATE OR REPLACE FUNCTION validate_and_redeem_invite_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_active boolean;
BEGIN
  SELECT is_active INTO found_active FROM invite_codes WHERE code = p_code;
  IF found_active IS NOT TRUE THEN
    RETURN false;
  END IF;
  UPDATE invite_codes SET click_count = click_count + 1 WHERE code = p_code;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_and_redeem_invite_code(text) TO anon, authenticated;
