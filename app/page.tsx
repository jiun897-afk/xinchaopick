import Link from "next/link";
import AuthButton from "../components/AuthButton";
import Logo from "../components/Logo";
import HomeBanner from "../components/HomeBanner";
import RegionRow from "../components/RegionRow";
import HomeSearch from "../components/HomeSearch";
import NotificationBell from "../components/NotificationBell";
import ChannelIcons from "../components/ChannelIcons";
import CategoryIcons from "../components/CategoryIcons";
import Mascot from "../components/Mascot";
import T from "../components/T";
import LangToggle from "../components/LangToggle";
import ModeSwitch from "../components/ModeSwitch";

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
            <a href="#campaigns"><T ko="체험단 찾기" vi="Tìm trải nghiệm" /></a>
            <a href="/partner"><T ko="사장님 입점 문의" vi="Dành cho chủ quán" /></a>
          </nav>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <LangToggle />
            <NotificationBell />
            <AuthButton />
          </span>
        </div>
      </header>

      <div className="hero">
        <div className="wrap">
          <div className="launch">
            <b><T ko="다낭 정식 오픈" vi="Chính thức ra mắt tại Đà Nẵng" /></b>&nbsp;<T ko="· 신청 무료" vi="· Đăng ký miễn phí" />
          </div>
          <h1>
            <T
              ko={<>베트남의 모든 체험,<br /><em>리뷰로 돌려받다</em></>}
              vi={<>Mọi trải nghiệm ở Việt Nam,<br /><em>nhận lại bằng review</em></>}
            />
          </h1>
          <div className="sub">
            <T
              ko={<>다낭 맛집·마사지·액티비티를 무료로 체험하고<br />네이버 블로그·유튜브·인스타그램에 솔직한 리뷰를 남겨보세요.</>}
              vi={<>Trải nghiệm miễn phí quán ăn, massage, hoạt động tại Đà Nẵng<br />và để lại review chân thật trên Blog, YouTube, Instagram.</>}
            />
          </div>
          <HomeSearch />
        </div>
      </div>

      <HomeBanner banners={banners} />

      <section className="list" id="campaigns">
        <div className="wrap">
          <div className="shead">
            <div>
              <div className="stitle"><T ko="어떤 체험을 찾으세요?" vi="Bạn muốn trải nghiệm gì?" /></div>
              <div className="ssub"><T ko={<>베트남 전역 · 지금 모집 중 {list.length}개 캠페인</>} vi={<>Toàn Việt Nam · Đang tuyển {list.length} chiến dịch</>} /></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Link
              href="/browse?t=체험단"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "linear-gradient(135deg, #ff7a45, #f04e1a)",
                color: "#fff",
                borderRadius: 18,
                padding: "22px 0 20px",
                boxShadow: "0 6px 18px rgba(240,78,26,.28)",
              }}
            >
              <span style={{ width: 74, height: 74, borderRadius: "50%", background: "rgba(255,255,255,.94)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -3px 8px rgba(217,66,15,.12)" }}>
                <Mascot variant="eat" size={60} />
              </span>
              <span style={{ fontSize: 17, fontWeight: 900 }}><T ko="체험단" vi="Trải nghiệm" /></span>
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}><T ko="방문하고 무료 체험" vi="Ghé quán & trải nghiệm miễn phí" /></span>
            </Link>
            <Link
              href="/browse?t=기자단"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                color: "#fff",
                borderRadius: 18,
                padding: "22px 0 20px",
                boxShadow: "0 6px 18px rgba(109,40,217,.28)",
              }}
            >
              <span style={{ width: 74, height: 74, borderRadius: "50%", background: "rgba(255,255,255,.94)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -3px 8px rgba(76,29,149,.12)" }}>
                <Mascot variant="write" size={60} />
              </span>
              <span style={{ fontSize: 17, fontWeight: 900 }}><T ko="기자단" vi="Viết bài" /></span>
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}><T ko="방문 없이 원고 작성" vi="Viết bài không cần ghé quán" /></span>
            </Link>
          </div>

          <RegionRow />
          <ChannelIcons />
          <CategoryIcons />

          <Link
            href="/map"
            className="selcard"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px" }}
          >
            <span
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "#DFF1FF",
                color: "#1D6FB8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.8 9.6c0 5-8.8 12.4-8.8 12.4S3.2 14.6 3.2 9.6a8.8 8.8 0 1 1 17.6 0Z" />
                <circle cx="12" cy="9.6" r="3.1" />
              </svg>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 900 }}><T ko="내 주변에서 찾기" vi="Tìm quanh tôi" /></span>
              <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--ink3)", marginTop: 2 }}>
                <T ko="지도로 가까운 체험 업체 보기 · 거리순 목록" vi="Xem quán gần bạn trên bản đồ · theo khoảng cách" />
              </span>
            </span>
            <span style={{ color: "var(--ink3)", fontWeight: 900 }}>›</span>
          </Link>

          <Link
            href="/community"
            className="selcard"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px" }}
          >
            <span
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "#EFE9FD",
                color: "#6D28D9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 900 }}><T ko="커뮤니티" vi="Cộng đồng" /></span>
              <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--ink3)", marginTop: 2 }}>
                <T ko="베트남 생활 · 맛집 정보 · 리뷰어 수다" vi="Đời sống VN · Quán ngon · Trò chuyện" />
              </span>
            </span>
            <span style={{ color: "var(--ink3)", fontWeight: 900 }}>›</span>
          </Link>

          <ModeSwitch />

          <Link
            href="/browse"
            className="btn ghost"
            style={{ width: "100%", marginTop: 14, padding: "14px 0", fontSize: 14.5, borderRadius: 16, background: "#fff" }}
          >
            <T ko={<>전체 캠페인 {list.length}개 모두 보기 →</>} vi={<>Xem tất cả {list.length} chiến dịch →</>} />
          </Link>
        </div>
      </section>

      <footer className="site">
        <div className="wrap">
          <div className="fbiz">
            <b style={{ color: "var(--ink2)" }}>베자뷰</b> · 주식회사 더제이엠그룹 · 대표이사 이정목
            <br />
            서울특별시 서초구 방배동 451-24 현성빌딩 3층
            <br />
            <span style={{ whiteSpace: "nowrap" }}>사업자등록번호 352-87-00902</span> · <span style={{ whiteSpace: "nowrap" }}>고객센터 1666-0464</span>
            <br />
            카카오톡 채널 @베자뷰 · help@vejaview.com
            <br />
            <a href="/terms" style={{ textDecoration: "underline" }}>이용약관</a> · <a href="/privacy" style={{ textDecoration: "underline" }}>개인정보처리방침</a> · <a href="/partner" style={{ textDecoration: "underline" }}>사장님 입점 안내</a>
          </div>
        </div>
      </footer>
    </>
  );
}
