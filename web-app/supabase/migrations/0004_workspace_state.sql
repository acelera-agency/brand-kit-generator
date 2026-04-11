alter table public.brand_kits
  add column if not exists workspace_state jsonb not null default '{}'::jsonb;
