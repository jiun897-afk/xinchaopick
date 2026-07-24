import Link from "next/link";
import AuthButton from "../components/AuthButton";
import Logo from "../components/Logo";
import HomeBanner from "../components/HomeBanner";
import RegionRow from "../components/RegionRow";
import HomeSearch from "../components/HomeSearch";
import CampaignGrid from "../components/CampaignGrid";
import NotificationBell from "../components/NotificationBell";
import ChannelIcons from "../components/ChannelIcons";

export const revalidate = 60;

type Campaign = {
  id: string;
  store_name: string;
  category: string;
  offer: string;
  mission_type: string;
  quota: number;
  applied: number;
  distance_m: number | null;
  area: string | null;
  image_url: string | null;
  badge: string | null;
  reward_points?: number | null;
  party_size?: number | null;
  created_at?: string | null;
  today_available?: boolean | null;
};

const FALLBACK: Campaign[] = [
  { id: "f1", store_name: "허벌 스파 다낭", category: "마사지·스파", offer: "아로마 90분 2인 · 70만동 한도 · 팁 포함", mission_type: "네이버 블로그", quota: 10, applied: 8, distance_m: 350, area: "미케비치", image_url: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=75&fm=jpg&fit=crop", badge: "마감 D-2" },
  { id: "f2", store_name: "분짜 꽌 안토이", category: "로컬맛집", offer: "2인 식사 40만동 한도 · 음료 포함", mission_type: "유튜브 쇼츠", quota: 15, applied: 12, distance_m: 520, area: "미케비치", image_url: "https://images.unsplash.com/photo-1597345637412-9fd611e758f3?w=800&q=75&fm=jpg&fit=crop", badge: "인기" },
  { id: "f3", store_name: "서울갈비 다낭점", category: "한식", offer: "4인 갈비세트 120만동 한도 · 주류 제외", mission_type: "네이버 블로그", quota: 8, applied: 3, distance_m: 1200, area: "안탕", image_url: "https://images.unsplash.com/photo-1632558610168-8377309e34c7?w=800&q=75&fm=jpg&fit=crop", badge: "NEW" },
  { id: "f4", store_name: "호이안 바구니배 투어", category: "투어·액티비티", offer: "2인 투어 + 픽업 포함 · 전액 무료", mission_type: "영상", quota: 20, applied: 19, distance_m: 2400, area: "호이안", image_url: "https://images.unsplash.com/photo-1722987170598-556327f43fc7?w=800&q=75&fm=jpg&fit=crop", badge: "신청 19/20" },
  { id: "f5", store_name: "코코넛 커피 랩", category: "카페·디저트", offer: "음료 2잔 + 디저트 1개 · 15만동 한도", mission_type: "네이버 클립", quota: 10, applied: 5, distance_m: 3100, area: "시내", image_url: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&q=75&fm=jpg&fit=crop", badge: "마감 D-5" },
  { id: "f6", store_name: "미케 발 마사지", category: "마사지·스파", offer: "발 마사지 60분 1인 · 25만동 한도", mission_type: "인스타그램", quota: 6, applied: 2, distance_m: 450, area: "미케비치", image_url: "https://images.unsplash.com/photo-1693578538512-fc66f318c833?w=800&q=75&fm=jpg&fit=crop", badge: "오늘 가능" },
];

async function getBanners() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(url + "/rest/v1/banners?active=eq.true&order=sort.asc&select=id,tag,title,sub,href,bg,art,dark", {
      headers: { apikey: key, Authorization: "Bearer " + key },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getCampaigns(): Promise<{ list: Campaign[]; live: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { list: FALLBACK, live: false };
  try {
    const res = await fetch(
      url + "/rest/v1/campaigns?status=eq.active&order=priority.desc,created_at.desc&limit=100",
      {
        headers: { apikey: key, Authorization: "Bearer " + key },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return { list: FALLBACK, live: false };
    const data = (await res.json()) as Campaign[];
    if (!Array.isArray(data) || data.length === 0) return { list: FALLBACK, live: false };
    return { list: data, live: true };
  } catch {
    return { list: FALLBACK, live: false };
  }
}

export default async function Home() {
  const [{ list, live }, banners] = await Promise.all([getCampaigns(), getBanners()]);
  return (
    <>
      <header className="site">
        <div className="wrap hbar">
          <Logo />
          <nav className="hnav">
            <a href="#campaigns">체험단 찾기</a>
            <a href="/partner">사장님 입점 문의</a>
          </nav>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <NotificationBell />
            <AuthButton />
          </span>
        </div>
      </header>

      <div className="hero">
        <div className="wrap">
          <div className="launch">
            <b>다낭 정식 오픈</b>&nbsp;· 신청 무료
          </div>
          <h1>
            베트남의 모든 체험,<br />
            <em>리뷰로 돌려받다</em>
          </h1>
          <div className="sub">
            다낭 맛집·마사지·액티비티를 무료로 체험하고<br />
            네이버 블로그·유튜브·인스타그램에 솔직한 리뷰를 남겨보세요.
          </div>
          <HomeSearch />
        </div>
      </div>

      <HomeBanner banners={banners} />

      <section className="list" id="campaigns">
        <div className="wrap">
          <div className="shead">
            <div>
              <div className="stitle">지금 모집 중인 체험단</div>
              <div className="ssub">베트남 전역 · 총 {list.length}개 캠페인</div>
            </div>
          </div>
          <RegionRow />
          <ChannelIcons />
          <CampaignGrid list={list} />
        </div>
      </section>

      <footer className="site">
        <div className="wrap">
          <div className="fbiz">
            <b style={{ color: "var(--ink2)" }}>베자뷰</b> · 주식회사 더제이엠그룹 · 대표이사 이정목
            <br />
            서울특별시 서초구 방배동 451-24 현성빌딩 3층 · 사업자등록번호 352-87-00902
            <br />
            고객센터 1666-0464 · 카카오톡 채널 @베자뷰 · help@vejaview.com
            <br />
            <a href="/partner" style={{ textDecoration: "underline" }}>사장님 입점 안내</a> · <a href="/app.html" style={{ textDecoration: "underline" }}>앱 디자인 시안</a> · <a href="/admin.html" style={{ textDecoration: "underline" }}>운영 콘솔</a>
          </div>
        </div>
      </footer>
    </>
  );
}
