-- 홈 배너 (관리자 편집: /admin/banners)
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  tag text default '공지',
  title text not null,
  sub text default '',
  href text default '#campaigns',
  bg text default 'linear-gradient(115deg,#FF7A45,#F04E1A)',
  art text default 'pin',
  dark boolean default true,
  sort int default 0,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.banners enable row level security;
create policy banners_read on public.banners for select using (true);
create policy banners_admin_write on public.banners for all
  using ((auth.jwt()->>'email') = 'admin@jmgroup.kr')
  with check ((auth.jwt()->>'email') = 'admin@jmgroup.kr');
