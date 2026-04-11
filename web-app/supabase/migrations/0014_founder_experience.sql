-- 0006_founder_experience.sql -- founder-facing experience metadata + inspiration locker

alter table public.brand_kits
  add column if not exists experience_mode text not null default 'guided'
    check (experience_mode in ('guided', 'expert-led')),
  add column if not exists handoff_requested_at timestamptz,
  add column if not exists draft_checkpoint text not null default 'none'
    check (draft_checkpoint in ('none', 'foundation', 'positioning', 'final')),
  add column if not exists inspiration_items jsonb not null default '[]'::jsonb;

create index if not exists brand_kits_experience_mode_idx
  on public.brand_kits(experience_mode);
