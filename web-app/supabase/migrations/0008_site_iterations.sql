-- 0008_site_iterations.sql -- persist post-generation iteration history

create table if not exists public.site_iterations (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.site_generations(id) on delete cascade,
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  turn_index integer not null check (turn_index >= 0),
  user_message text,
  v0_message_id text,
  v0_version_id text,
  demo_url text,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  error_message text,
  prompt_cost numeric,
  completion_cost numeric,
  total_cost numeric,
  tokens_charged bigint not null default 0,
  usage_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists site_iterations_generation_turn_idx
  on public.site_iterations(generation_id, turn_index);

create index if not exists site_iterations_kit_created_at_idx
  on public.site_iterations(kit_id, created_at desc);

create index if not exists site_iterations_actor_id_idx
  on public.site_iterations(actor_id);

alter table public.site_iterations enable row level security;

drop policy if exists "Members see site iterations" on public.site_iterations;
drop policy if exists "Editors insert site iterations" on public.site_iterations;

create policy "Members see site iterations" on public.site_iterations for select
  using (public.is_kit_member(kit_id, 'viewer'));

create policy "Editors insert site iterations" on public.site_iterations for insert
  with check (
    public.is_kit_member(kit_id, 'editor')
    and actor_id = auth.uid()
  );

insert into public.site_iterations (
  generation_id,
  kit_id,
  actor_id,
  turn_index,
  user_message,
  v0_message_id,
  v0_version_id,
  demo_url,
  status,
  tokens_charged,
  created_at
)
select
  generation.id,
  generation.kit_id,
  generation.owner_id,
  0,
  null,
  null,
  generation.v0_version_id,
  generation.demo_url,
  'completed',
  0,
  generation.created_at
from public.site_generations as generation
where generation.status = 'completed'
  and not exists (
    select 1
    from public.site_iterations as iteration
    where iteration.generation_id = generation.id
      and iteration.turn_index = 0
  );
