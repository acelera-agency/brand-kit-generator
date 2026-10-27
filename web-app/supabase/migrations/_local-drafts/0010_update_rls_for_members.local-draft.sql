-- 0010_update_rls_for_members.sql — swap RLS to use is_kit_member for collaboration

-- ============================================================
-- brand_kits
-- ============================================================
drop policy if exists "Users see own kits"      on public.brand_kits;
drop policy if exists "Users insert own kits"   on public.brand_kits;
drop policy if exists "Users update own kits"   on public.brand_kits;
drop policy if exists "Users delete own kits"   on public.brand_kits;

create policy "Members see kit" on public.brand_kits for select
  using (public.is_kit_member(id, 'viewer'));

create policy "Owners insert kits" on public.brand_kits for insert
  with check (auth.uid() = owner_id);

create policy "Editors update kit" on public.brand_kits for update
  using (public.is_kit_member(id, 'editor'));

create policy "Owners delete kit" on public.brand_kits for delete
  using (public.is_kit_member(id, 'owner'));

-- ============================================================
-- interview_messages
-- ============================================================
drop policy if exists "Users see own messages"  on public.interview_messages;
drop policy if exists "Users insert own messages" on public.interview_messages;

create policy "Members see messages" on public.interview_messages for select
  using (public.is_kit_member(kit_id, 'viewer'));

create policy "Editors insert messages" on public.interview_messages for insert
  with check (public.is_kit_member(kit_id, 'editor'));

-- ============================================================
-- stage_progress
-- ============================================================
drop policy if exists "Users see own progress"  on public.stage_progress;
drop policy if exists "Users update own progress" on public.stage_progress;

create policy "Members see progress" on public.stage_progress for select
  using (public.is_kit_member(kit_id, 'viewer'));

create policy "Editors update progress" on public.stage_progress for all
  using (public.is_kit_member(kit_id, 'editor'));

-- ============================================================
-- site_generations
-- ============================================================
drop policy if exists "Users see own site generations"   on public.site_generations;
drop policy if exists "Users insert own site generations" on public.site_generations;
drop policy if exists "Users update own site generations" on public.site_generations;

create policy "Members see site generations" on public.site_generations for select
  using (public.is_kit_member(kit_id, 'viewer'));

create policy "Editors insert site generations" on public.site_generations for insert
  with check (public.is_kit_member(kit_id, 'editor'));

create policy "Editors update site generations" on public.site_generations for update
  using (public.is_kit_member(kit_id, 'editor'));
