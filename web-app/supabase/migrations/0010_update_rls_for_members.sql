-- 0010_update_rls_for_members.sql -- allow collaborators to read and edit kits

alter table public.brand_kits enable row level security;

alter table public.interview_messages enable row level security;

alter table public.stage_progress enable row level security;

alter table public.site_generations enable row level security;

drop policy if exists "Users see own kits" on public.brand_kits;

drop policy if exists "Users insert own kits" on public.brand_kits;

drop policy if exists "Users update own kits" on public.brand_kits;

drop policy if exists "Users delete own kits" on public.brand_kits;

drop policy if exists "Members see kit" on public.brand_kits;

drop policy if exists "Owners insert kits" on public.brand_kits;

drop policy if exists "Editors update kit" on public.brand_kits;

drop policy if exists "Owners delete kit" on public.brand_kits;

create policy "Members see kit" on public.brand_kits for select
  using (public.is_kit_member(id, 'viewer'));

create policy "Owners insert kits" on public.brand_kits for insert
  with check (auth.uid() = owner_id);

create policy "Editors update kit" on public.brand_kits for update
  using (public.is_kit_member(id, 'editor'))
  with check (public.is_kit_member(id, 'editor'));

create policy "Owners delete kit" on public.brand_kits for delete
  using (public.is_kit_member(id, 'owner'));

drop policy if exists "Users see own messages" on public.interview_messages;

drop policy if exists "Users insert own messages" on public.interview_messages;

drop policy if exists "Members see messages" on public.interview_messages;

drop policy if exists "Editors insert messages" on public.interview_messages;

drop policy if exists "Editors update messages" on public.interview_messages;

drop policy if exists "Owners delete messages" on public.interview_messages;

create policy "Members see messages" on public.interview_messages for select
  using (public.is_kit_member(kit_id, 'viewer'));

create policy "Editors insert messages" on public.interview_messages for insert
  with check (public.is_kit_member(kit_id, 'editor'));

create policy "Editors update messages" on public.interview_messages for update
  using (public.is_kit_member(kit_id, 'editor'))
  with check (public.is_kit_member(kit_id, 'editor'));

create policy "Owners delete messages" on public.interview_messages for delete
  using (public.is_kit_member(kit_id, 'owner'));

drop policy if exists "Users see own progress" on public.stage_progress;

drop policy if exists "Users update own progress" on public.stage_progress;

drop policy if exists "Members see progress" on public.stage_progress;

drop policy if exists "Editors insert progress" on public.stage_progress;

drop policy if exists "Editors update progress" on public.stage_progress;

drop policy if exists "Owners delete progress" on public.stage_progress;

create policy "Members see progress" on public.stage_progress for select
  using (public.is_kit_member(kit_id, 'viewer'));

create policy "Editors insert progress" on public.stage_progress for insert
  with check (public.is_kit_member(kit_id, 'editor'));

create policy "Editors update progress" on public.stage_progress for update
  using (public.is_kit_member(kit_id, 'editor'))
  with check (public.is_kit_member(kit_id, 'editor'));

create policy "Owners delete progress" on public.stage_progress for delete
  using (public.is_kit_member(kit_id, 'owner'));

drop policy if exists "Users see own site generations" on public.site_generations;

drop policy if exists "Users insert own site generations" on public.site_generations;

drop policy if exists "Users update own site generations" on public.site_generations;

drop policy if exists "Members see site generations" on public.site_generations;

drop policy if exists "Editors insert site generations" on public.site_generations;

drop policy if exists "Editors update site generations" on public.site_generations;

drop policy if exists "Owners delete site generations" on public.site_generations;

create policy "Members see site generations" on public.site_generations for select
  using (public.is_kit_member(kit_id, 'viewer'));

create policy "Editors insert site generations" on public.site_generations for insert
  with check (public.is_kit_member(kit_id, 'editor'));

create policy "Editors update site generations" on public.site_generations for update
  using (public.is_kit_member(kit_id, 'editor'))
  with check (public.is_kit_member(kit_id, 'editor'));

create policy "Owners delete site generations" on public.site_generations for delete
  using (public.is_kit_member(kit_id, 'owner'));
