-- 0006_kit_members.sql -- collaborators per brand kit

create table if not exists public.kit_members (
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (kit_id, user_id)
);

create index if not exists kit_members_user_id_idx
  on public.kit_members(user_id);

create or replace function public.is_kit_member(
  p_kit_id uuid,
  p_min_role text default 'viewer'
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.kit_members
    where kit_id = p_kit_id
      and user_id = auth.uid()
      and case p_min_role
        when 'owner' then role = 'owner'
        when 'editor' then role in ('owner', 'editor')
        when 'viewer' then role in ('owner', 'editor', 'viewer')
        else false
      end
  );
$$;

alter table public.kit_members enable row level security;

drop policy if exists "Members see kit members" on public.kit_members;

drop policy if exists "Owners insert kit members" on public.kit_members;

drop policy if exists "Owners update kit members" on public.kit_members;

drop policy if exists "Owners delete kit members" on public.kit_members;

create policy "Members see kit members" on public.kit_members for select
  using (public.is_kit_member(kit_id, 'viewer'));

create policy "Owners insert kit members" on public.kit_members for insert
  with check (public.is_kit_member(kit_id, 'owner'));

create policy "Owners update kit members" on public.kit_members for update
  using (public.is_kit_member(kit_id, 'owner'))
  with check (public.is_kit_member(kit_id, 'owner'));

create policy "Owners delete kit members" on public.kit_members for delete
  using (public.is_kit_member(kit_id, 'owner'));

insert into public.kit_members (kit_id, user_id, role)
select id, owner_id, 'owner'
from public.brand_kits
on conflict (kit_id, user_id) do nothing;

create or replace function public.kit_owner_autoadd()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.kit_members (kit_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (kit_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists brand_kits_owner_autoadd on public.brand_kits;

create trigger brand_kits_owner_autoadd
  after insert on public.brand_kits
  for each row execute function public.kit_owner_autoadd();
