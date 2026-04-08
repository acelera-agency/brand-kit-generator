-- 0001_initial.sql — brand-kit-generator SaaS schema v1

-- Brand kits (the source of truth, JSONB)
create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'completed', 'published')),
  kit jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.brand_kits(owner_id);
create index on public.brand_kits(status);

-- Interview messages (chat history per kit)
create table public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  stage_id text not null,
  created_at timestamptz not null default now()
);

create index on public.interview_messages(kit_id, created_at);

-- Stage progress (which gates have passed)
create table public.stage_progress (
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  stage_id text not null,
  status text not null default 'empty' check (status in ('empty', 'in-progress', 'passed')),
  passed_at timestamptz,
  primary key (kit_id, stage_id)
);

-- Free tier abuse cap: count interviews per email per month
create table public.interview_quota (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_month_count int not null default 0,
  current_month_start date not null default date_trunc('month', now())::date,
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at on brand_kits
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger brand_kits_updated_at
  before update on public.brand_kits
  for each row execute function public.touch_updated_at();

-- RLS: users can only see their own kits
alter table public.brand_kits enable row level security;
create policy "Users see own kits"      on public.brand_kits for select using (auth.uid() = owner_id);
create policy "Users insert own kits"   on public.brand_kits for insert with check (auth.uid() = owner_id);
create policy "Users update own kits"   on public.brand_kits for update using (auth.uid() = owner_id);
create policy "Users delete own kits"   on public.brand_kits for delete using (auth.uid() = owner_id);

alter table public.interview_messages enable row level security;
create policy "Users see own messages" on public.interview_messages for select
  using (exists (select 1 from public.brand_kits where id = kit_id and owner_id = auth.uid()));
create policy "Users insert own messages" on public.interview_messages for insert
  with check (exists (select 1 from public.brand_kits where id = kit_id and owner_id = auth.uid()));

alter table public.stage_progress enable row level security;
create policy "Users see own progress" on public.stage_progress for select
  using (exists (select 1 from public.brand_kits where id = kit_id and owner_id = auth.uid()));
create policy "Users update own progress" on public.stage_progress for all
  using (exists (select 1 from public.brand_kits where id = kit_id and owner_id = auth.uid()));

alter table public.interview_quota enable row level security;
create policy "Users see own quota" on public.interview_quota for select using (auth.uid() = user_id);
