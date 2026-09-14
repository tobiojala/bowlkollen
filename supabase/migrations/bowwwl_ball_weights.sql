-- Per-weight core specs for the ball catalog. bowwwl's v1 endpoint returns weight-
-- specific RG/diff/int-diff (?weight=16), and they genuinely differ by weight. We store
-- them as one jsonb per klot keyed by weight, so the detail sheet's weight picker can
-- show the numbers for the chosen lb. The base rg/differential/int_diff columns stay the
-- 15 lb reference (v2 default). Re-run balls-sync after this to populate.
--   specs_by_weight = { "14": {"rg":2.59,"diff":0.05,"int":0.019}, "15": {...}, "16": {...} }

ALTER TABLE public.bowling_balls
  ADD COLUMN IF NOT EXISTS specs_by_weight jsonb;
