-- Extend the private diary (player_notes) beyond match-prep: standalone entries
-- for training and competitions outside league play. Two nullable columns keep
-- every existing prep note valid (entry_type null = a legacy match-prep note).
--
--   entry_type — 'traning' | 'tavling' | 'match' | 'ovrigt' (UI labels are Swedish)
--   entry_date — when it happened; null falls back to created_at in the feed

alter table public.player_notes
  add column if not exists entry_type text,
  add column if not exists entry_date date;

-- The diary feed reads all of a user's notes newest-first.
create index if not exists player_notes_user_created_idx
  on public.player_notes (user_id, created_at desc);
