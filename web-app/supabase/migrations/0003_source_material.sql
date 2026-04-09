-- 0003_source_material.sql -- persist imported source material for material-assisted interviews

alter table public.brand_kits
  add column if not exists source_material text,
  add column if not exists source_material_meta jsonb not null default '{}'::jsonb;
