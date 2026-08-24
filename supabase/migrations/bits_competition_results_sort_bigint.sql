-- Follow-up to bits_competitions.sql: BITS' resultSortOrder is a 10-digit key
-- (e.g. 10000000208) that overflows int4. Widen to bigint so results ingest.
-- (Only needed if bits_competitions.sql was applied before this fix.)
ALTER TABLE public.bits_competition_results
  ALTER COLUMN result_sort_order TYPE bigint;
