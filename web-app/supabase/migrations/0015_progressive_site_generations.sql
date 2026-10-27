-- 0015_progressive_site_generations.sql -- track live v0 drafts separately from final site generations

alter table public.site_generations
  add column if not exists generation_mode text not null default 'final'
    check (generation_mode in ('progressive', 'final'));

alter table public.site_iterations
  add column if not exists source_stage_id text
    check (
      source_stage_id is null
      or source_stage_id in (
        'stage_0',
        'stage_1',
        'stage_2',
        'stage_3',
        'stage_4',
        'stage_5',
        'stage_6',
        'stage_7',
        'stage_8'
      )
    ),
  add column if not exists input_hash text;

create index if not exists site_generations_kit_mode_created_at_idx
  on public.site_generations(kit_id, generation_mode, created_at desc);

create unique index if not exists site_iterations_generation_stage_hash_idx
  on public.site_iterations(generation_id, source_stage_id, input_hash)
  where source_stage_id is not null
    and input_hash is not null;

create index if not exists site_iterations_progressive_pending_idx
  on public.site_iterations(generation_id, status, turn_index)
  where source_stage_id is not null;
