-- 신청(applications) 테이블 — M1.5
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending', -- pending / selected / rejected / cancelled
  unique (campaign_id, user_id)
);

alter table public.applications enable row level security;

create policy "apps_insert_own" on public.applications
  for insert with check (auth.uid() = user_id);

create policy "apps_select_own" on public.applications
  for select using (auth.uid() = user_id);

create policy "apps_delete_own" on public.applications
  for delete using (auth.uid() = user_id);

-- 신청/취소 시 캠페인 신청 수 자동 반영
create or replace function public.bump_applied()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.campaigns set applied = applied + 1 where id = new.campaign_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.campaigns set applied = greatest(applied - 1, 0) where id = old.campaign_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger applications_bump
  after insert or delete on public.applications
  for each row execute function public.bump_applied();
