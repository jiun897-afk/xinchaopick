-- 씬짜오PICK 데이터베이스 스키마 v1 (M1)
-- Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 Run 하세요.

-- 1. 캠페인 테이블
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  store_name text not null,
  category text not null,
  offer text not null,
  mission_type text not null,           -- 네이버 블로그 / 유튜브 쇼츠 / 네이버 클립 / 인스타그램 / 영상
  quota int not null default 10,        -- 모집 정원
  applied int not null default 0,       -- 신청 수
  distance_m int,                        -- 데모용 거리(추후 PostGIS 좌표로 대체)
  area text,                             -- 미케비치 / 안탕 / 시내 / 호이안
  image_url text,
  badge text,                            -- 마감 D-2 / 인기 / NEW ...
  status text not null default 'active', -- active / closed / pending
  priority int not null default 0,       -- AD 상단 고정용
  today_available boolean not null default false,
  deadline date
);

alter table public.campaigns enable row level security;

drop policy if exists "campaigns_public_read" on public.campaigns;
create policy "campaigns_public_read"
  on public.campaigns for select
  using (true);

-- 2. 프로필 테이블 (가입 시 자동 생성)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  nickname text,
  role text not null default 'reviewer'  -- reviewer / owner / admin
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. 가입하면 프로필 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, split_part(coalesce(new.email, '리뷰어'), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. 시드 데이터 (데모 캠페인 6개)
insert into public.campaigns
  (store_name, category, offer, mission_type, quota, applied, distance_m, area, image_url, badge, today_available, priority)
values
  ('허벌 스파 다낭', '마사지·스파', '아로마 90분 2인 · 70만동 한도 · 팁 포함', '네이버 블로그', 10, 8, 350, '미케비치', 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=75&fm=jpg&fit=crop', '마감 D-2', true, 10),
  ('분짜 꽌 안토이', '로컬맛집', '2인 식사 40만동 한도 · 음료 포함', '유튜브 쇼츠', 15, 12, 520, '미케비치', 'https://images.unsplash.com/photo-1597345637412-9fd611e758f3?w=800&q=75&fm=jpg&fit=crop', '인기', true, 0),
  ('서울갈비 다낭점', '한식', '4인 갈비세트 120만동 한도 · 주류 제외', '네이버 블로그', 8, 3, 1200, '안탕', 'https://images.unsplash.com/photo-1632558610168-8377309e34c7?w=800&q=75&fm=jpg&fit=crop', 'NEW', false, 0),
  ('호이안 바구니배 투어', '투어·액티비티', '2인 투어 + 픽업 포함 · 전액 무료', '영상', 20, 19, 2400, '호이안', 'https://images.unsplash.com/photo-1722987170598-556327f43fc7?w=800&q=75&fm=jpg&fit=crop', '신청 19/20', false, 0),
  ('코코넛 커피 랩', '카페·디저트', '음료 2잔 + 디저트 1개 · 15만동 한도', '네이버 클립', 10, 5, 3100, '시내', 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&q=75&fm=jpg&fit=crop', '마감 D-5', false, 0),
  ('미케 발 마사지', '마사지·스파', '발 마사지 60분 1인 · 25만동 한도', '인스타그램', 6, 2, 450, '미케비치', 'https://images.unsplash.com/photo-1693578538512-fc66f318c833?w=800&q=75&fm=jpg&fit=crop', '오늘 가능', true, 0);
