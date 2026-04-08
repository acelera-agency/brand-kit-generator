-- 0002_brand_stage.sql — classify each kit as a new brand or an existing one
--
-- Phase B Batch 1: support founders building from scratch (no past clients,
-- no past copy) alongside the existing-brand redesign flow that was the
-- original Phase A target. The brand_stage column drives the per-stage
-- question variants and the gate-check anti-fabrication instructions.

alter table public.brand_kits
  add column if not exists brand_stage text not null default 'new'
  check (brand_stage in ('new', 'existing'));

create index if not exists brand_kits_brand_stage_idx
  on public.brand_kits(brand_stage);
