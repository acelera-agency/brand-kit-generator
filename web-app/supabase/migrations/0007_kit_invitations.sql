-- 0007_kit_invitations.sql -- invite collaborators by email

create table if not exists public.kit_invitations (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.brand_kits(id) on delete cascade,
  email text not null,
  role text not null check (role in ('editor', 'viewer')),
  token text not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists kit_invitations_kit_id_created_at_idx
  on public.kit_invitations(kit_id, created_at desc);

create unique index if not exists kit_invitations_pending_email_unique
  on public.kit_invitations(kit_id, lower(btrim(email)))
  where accepted_at is null;

alter table public.kit_invitations enable row level security;

drop policy if exists "Owners see invitations" on public.kit_invitations;

drop policy if exists "Owners insert invitations" on public.kit_invitations;

drop policy if exists "Owners update invitations" on public.kit_invitations;

drop policy if exists "Owners delete invitations" on public.kit_invitations;

create policy "Owners see invitations" on public.kit_invitations for select
  using (public.is_kit_member(kit_id, 'owner'));

create policy "Owners insert invitations" on public.kit_invitations for insert
  with check (public.is_kit_member(kit_id, 'owner'));

create policy "Owners update invitations" on public.kit_invitations for update
  using (public.is_kit_member(kit_id, 'owner'))
  with check (public.is_kit_member(kit_id, 'owner'));

create policy "Owners delete invitations" on public.kit_invitations for delete
  using (public.is_kit_member(kit_id, 'owner'));
