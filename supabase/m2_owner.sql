-- M2: 사장님 기능 (캠페인 소유·등록·선정)
alter table public.campaigns add column if not exists owner_id uuid references auth.users(id);

drop policy if exists "campaigns_insert_own" on public.campaigns;
create policy "campaigns_insert_own" on public.campaigns
  for insert with check (auth.uid() = owner_id);

drop policy if exists "campaigns_update_own" on public.campaigns;
create policy "campaigns_update_own" on public.campaigns
  for update using (auth.uid() = owner_id);

drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles
  for select using (true);

drop policy if exists "apps_select_campaign_owner" on public.applications;
create policy "apps_select_campaign_owner" on public.applications
  for select using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = auth.uid()));

drop policy if exists "apps_update_campaign_owner" on public.applications;
create policy "apps_update_campaign_owner" on public.applications
  for update using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = auth.uid()));
