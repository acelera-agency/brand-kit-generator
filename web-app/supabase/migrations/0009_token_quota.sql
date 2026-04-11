-- 0009_token_quota.sql -- per-user monthly token quota

create table if not exists public.token_quota (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_limit bigint not null default 100000 check (monthly_limit >= 0),
  current_month_used bigint not null default 0 check (current_month_used >= 0),
  current_month_start date not null default date_trunc('month', now())::date,
  updated_at timestamptz not null default now()
);

create trigger token_quota_updated_at
  before update on public.token_quota
  for each row execute function public.touch_updated_at();

alter table public.token_quota enable row level security;

drop policy if exists "Users see own token quota" on public.token_quota;

create policy "Users see own token quota" on public.token_quota for select
  using (auth.uid() = user_id);

create or replace function public.claim_token_budget(
  p_user_id uuid,
  p_estimate bigint
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month date := date_trunc('month', now())::date;
begin
  insert into public.token_quota (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  update public.token_quota
  set current_month_used = 0,
      current_month_start = current_month,
      updated_at = now()
  where user_id = p_user_id
    and current_month_start < current_month;

  update public.token_quota
  set current_month_used = current_month_used + p_estimate,
      updated_at = now()
  where user_id = p_user_id
    and current_month_used + p_estimate <= monthly_limit;

  return found;
end;
$$;
