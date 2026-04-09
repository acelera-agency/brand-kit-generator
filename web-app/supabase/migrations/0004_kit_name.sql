-- 0004_kit_name.sql -- give every brand kit a required, per-owner unique name
--
-- Users were ending up with a wall of unnamed cards on the dashboard. We
-- now require a human label at creation time, unique within each owner so
-- the dashboard can show "Acme rebrand" instead of a UUID prefix and so
-- duplicate runs can't shadow each other.

alter table public.brand_kits
  add column if not exists name text;

-- Backfill any pre-existing rows with a deterministic placeholder so the
-- NOT NULL constraint below succeeds. New rows always supply a name.
update public.brand_kits
  set name = 'Untitled kit ' || substr(id::text, 1, 8)
  where name is null;

alter table public.brand_kits
  alter column name set not null;

alter table public.brand_kits
  add constraint brand_kits_name_not_blank check (length(btrim(name)) > 0);

create unique index if not exists brand_kits_owner_name_unique
  on public.brand_kits(owner_id, lower(btrim(name)));
