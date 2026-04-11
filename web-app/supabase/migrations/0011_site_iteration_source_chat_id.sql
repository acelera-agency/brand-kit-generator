-- 0011_site_iteration_source_chat_id.sql -- keep the chat lineage for restore branching

alter table public.site_iterations
  add column if not exists source_chat_id text;

update public.site_iterations as iteration
set source_chat_id = generation.v0_chat_id
from public.site_generations as generation
where iteration.generation_id = generation.id
  and iteration.source_chat_id is null
  and generation.v0_chat_id is not null;
