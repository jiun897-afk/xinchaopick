import Link from "next/link";

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
};

const FALLBACK: Campaign[] = [
  { id: "f1", store_name: "허벌 스파 다낭", category: "마사지·스파", offer: "아로마 90분 2인 · 70만동 한도 · 팁 포함", mission_type: "네이버 블로그", quota: 10, applied: 8, distance_m: 350, area: "미케비치", image_url: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=75&fm=jpg&fit=crop", badge: "마감 D-2" },
  { id: "f2", store_name: "분짜 꽌 안토이", category: "로컬맛집", offer: "2인 식사 40만동 한도 · 음료 포함", mission_type: "유튜브 쇼츠", quota: 15, applied: 12, distance_m: 520, area: "미케비치", image_url: "https://images.unsplash.com/photo-1597345637412-9fd611e758f3?w=800&q=75&fm=jpg&fit=crop", badge: "인기" },
  { id: "f3", store_name: "서울갈비 다낭점", category: "한식", offer: "4인 갈비세트 120만동 한도 · 주류 제외", mission_type: "네이버 블로그", quota: 8, applied: 3, distance_m: 1200, area: "안탕", image_url: "https://images.unsplash.com/photo-1632558610168-8377309e34c7?w=800&q=75&fm=jpg&fit=crop", badge: "NEW" },
  { id: "f4", store_name: "호이안 바구니배 투어", category: "투어·액티비티", offer: "2인 투어 + 픽업 포함 · 전액 무료", mission_type: "영상", quota: 20, applied: 19, distance_m: 2400, area: "호이안", image_url: "https://images.unsplash.com/photo-1722987170598-556327f43fc7?w=800&q=75&fm=jpg&fit=crop", badge: "신청 19/20" },
  { id: "f5", store_name: "코코넛 커피 랩", category: "카페·디저트", offer: "음료 2잔 + 디저트 1개 · 15만동 한도", mission_type: "네이버 클립", quota: 10, applied: 5, distance_m: 3100, area: "시내", image_url: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&q=75&fm=jpg&fit=crop", badge: "마감 D-5" },
  { id: "f6", store_name: "미케 발 마사지", category: "마사지·스파", offer: "발 마사지 60분 1인 · 25만동 한도", mission_type: "인스타그램", quota: 6, applied: 2, distance_m: 450, area: "미케비치", image_url: "https://images.unsplash.com/photo-1693578538512-fc66f318c833?w=800&q=75&fm=jpg&fit=crop", badge: "오늘 가능" },
];

async function getCampaigns(): Promise<{ list: Campaign[]; live: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { list: FALLBACK, live: false };
  try {
    const res = await fetch(
      url + "/rest/v1/campaigns?status=eq.active&order=priority.desc,created_at.desc&limit=12",
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

function fmtDistance(m: number | null) {
  if (m == null) return "";
  return m >= 1000 ? (m / 1000).toFixed(1) + "km" : m + "m";
}

export default async function Home() {
  const { list, live } = await getCampaigns();
  return (
    <>
      <header className="site">
        <div className="wrap hbar">
          <Link className="hlogo" href="/">
            <span className="mark">
              <svg width="21" height="22" viewBox="0 0 120 124">
                <path d="M60 118 C60 118 30 86 30 61 A30 30 0 1 1 90 61 C90 86 60 118 60 118 Z" fill="#ffffff" />
                <circle cx="60" cy="59" r="12.5" fill="#F55B24" />
                <path d="M60 6 C64 6 88 26 94 34 L26 34 C32 26 56 6 60 6 Z" fill="#FFDDBB" />
                <path d="M18 34 Q60 46 102 34 Q98 40 60 42 Q22 40 18 34 Z" fill="#F3A469" />
              </svg>
            </span>
            씬짜오<span className="pick">PICK</span>
          </Link>
          <nav className="hnav">
            <a href="#campaigns">체험단 찾기</a>
            <a href="/app.html">앱 미리보기</a>
            <a href="/doitac.html">Tiếng Việt</a>
            <a href="/admin.html">관리자</a>
          </nav>
          <div className="hcta">
            <Link className="btn ghost" href="/login">로그인</Link>
            <Link className="btn pri" href="/login">시작하기</Link>
          </div>
        </div>
      </header>

      <div className="hero">
        <div className="wrap">
          <div className={"livebadge " + (live ? "on" : "off")}>
            <span className="dot" />
            {live ? "실시간 — 데이터베이스 연동됨" : "미리보기 데이터 (DB 연결 대기 중)"}
          </div>
          <h1>
            베트남의 모든 체험,<br />
            <em>리뷰로 돌려받다</em>
          </h1>
          <div className="sub">
            다낭 맛집·마사지·액티비티를 무료로 체험하고<br />
            네이버 블로그·유튜브·인스타그램에 솔직한 리뷰를 남겨보세요.
          </div>
        </div>
      </div>

      <section className="list" id="campaigns">
        <div className="wrap">
          <div className="shead">
            <div>
              <div className="stitle">지금 모집 중인 체험단</div>
              <div className="ssub">다낭 · 총 {list.length}개 캠페인</div>
            </div>
          </div>
          <div className="grid">
            {list.map((c) => (
              <div className="gcard" key={c.id}>
                <div
                  className="gthumb"
                  style={c.image_url ? { backgroundImage: "url(" + c.image_url + ")" } : undefined}
                >
                  {c.badge ? <span className="gbadge hot">{c.badge}</span> : null}
                </div>
                <div className="ginfo">
                  <div className="gcat">{c.category}</div>
                  <div className="gname">{c.store_name}</div>
                  <div className="goffer">{c.offer}</div>
                  <div className="gmeta">
                    {fmtDistance(c.distance_m)}
                    {c.area ? " · " + c.area : ""} · 신청 {c.applied}/{c.quota}
                    <span className="gpoint">{c.mission_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="site">
        <div className="wrap">
          <div className="fbiz">
            <b style={{ color: "var(--ink2)" }}>씬짜오PICK</b> · 주식회사 더제이엠그룹 · 대표이사 이정목
            <br />
            서울특별시 서초구 방배동 451-24 현성빌딩 3층 · 사업자등록번호 352-87-00902
            <br />
            고객센터 1666-0464 · 카카오톡 채널 @씬짜오픽 · help@xinchaopick.com
          </div>
        </div>
      </footer>
    </>
  );
}
