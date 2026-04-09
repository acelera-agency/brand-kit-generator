-- 0005_site_generations.sql -- track v0 site generation attempts per kit
create table public.site_generations (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'completed', 'failed')),
  v0_project_id text,
  v0_chat_id text,
  v0_version_id text,
  demo_url text,
  generated_files jsonb default '[]'::jsonb,
  prompt_hash text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.site_generations(kit_id);
create index on public.site_generations(owner_id);

alter table public.site_generations enable row level security;
create policy "Users see own site generations" on public.site_generations for select
  using (auth.uid() = owner_id);
create policy "Users insert own site generations" on public.site_generations for insert
  with check (auth.uid() = owner_id);
create policy "Users update own site generations" on public.site_generations for update
  using (auth.uid() = owner_id);

create trigger site_generations_updated_at
  before update on public.site_generations
  for each row execute function public.touch_updated_at();
