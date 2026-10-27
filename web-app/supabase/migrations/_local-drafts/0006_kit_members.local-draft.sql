-- 0006_kit_members.sql — kit membership table + is_kit_member helper + auto-add trigger

create table public.kit_members (
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (kit_id, user_id)
);

create index on public.kit_members(user_id);

-- Helper function: check membership with role hierarchy (owner > editor > viewer)
-- SECURITY DEFINER avoids RLS recursion on kit_members itself
create or replace function public.is_kit_member(
  p_kit_id uuid,
  p_min_role text default 'viewer'
) returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.kit_members
    where kit_id = p_kit_id
      and user_id = auth.uid()
      and case p_min_role
            when 'owner'  then role = 'owner'
            when 'editor' then role in ('owner', 'editor')
            when 'viewer' then role in ('owner', 'editor', 'viewer')
          end
  );
$$;

-- RLS on kit_members
alter table public.kit_members enable row level security;

create policy "Members see co-members" on public.kit_members for select
  using (public.is_kit_member(kit_id, 'viewer'));

create policy "Owners manage members" on public.kit_members for all
  using (public.is_kit_member(kit_id, 'owner'));

-- Backfill: every existing kit owner becomes a member with role 'owner'
insert into public.kit_members (kit_id, user_id, role)
  select id, owner_id, 'owner'
  from public.brand_kits
  on conflict do nothing;

-- Trigger: auto-add kit owner as member on brand_kits insert
create or replace function public.kit_owner_autoadd()
returns trigger as $$
begin
  insert into public.kit_members (kit_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer
set search_path = public;

create trigger brand_kits_owner_autoadd
  after insert on public.brand_kits
  for each row execute function public.kit_owner_autoadd();
