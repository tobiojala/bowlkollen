-- Silence "Function Search Path Mutable" for the two trigger helpers that
-- shipped without an explicit search_path. Every other function already sets it.
-- ALTER (not re-create) so no body is needed.
alter function public.touch_player_notes() set search_path = public;
alter function public.touch_updated_at() set search_path = public;
