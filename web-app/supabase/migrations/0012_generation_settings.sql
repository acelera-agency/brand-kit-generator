alter table site_generations
  add column if not exists generation_settings jsonb default '{}';
