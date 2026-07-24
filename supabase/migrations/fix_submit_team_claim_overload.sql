-- Fix: two submit_team_claim overloads coexist in prod — the legacy 2-arg
-- (team_claims.sql) and the hardened 3-arg with invite vouching + bootstrap→captain
-- (invite_scoped_claims.sql). PostgREST can't resolve a 2-arg call between them
-- (PGRST203), so the mobile "Gå med i laget" fails. invite_scoped_claims.sql was
-- meant to DROP the 2-arg; it came back (team_claims.sql re-run after it). Drop it
-- again so only the hardened version remains — every caller then resolves cleanly.

DROP FUNCTION IF EXISTS public.submit_team_claim(integer, text);

-- Sanity: the surviving function should be the 3-arg one.
-- SELECT proname, pg_get_function_identity_arguments(oid)
-- FROM pg_proc WHERE proname = 'submit_team_claim';
