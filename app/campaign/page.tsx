import Link from "next/link";
import ApplyButton from "../../components/ApplyButton";
import AuthButton from "../../components/AuthButton";
import Logo from "../../components/Logo";

export const revalidate = 15;

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
  today_available: boolean;
  deadline: string | null;
  created_at: string;
  reward_points: number | null;
  party_size: number | null;
  place_id: string | null;
};

type PlaceInfo = { id: string; name: string; address: string; maps_url: string; phone: string; photos: string[] | null; lat: number | null; lng: number | null } | null;

type PlaceReviewInfo = { avg: number; count: number; latest: { rating: number; content: string; verified: boolean }[] };

async function getPlaceReviews(placeId: string): Promise<PlaceReviewInfo> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const empty = { avg: 0, count: 0, latest: [] as PlaceReviewInfo["latest"] };
  if (!url || !key) return empty;
  try {
    const H = { apikey: key, Authorization: "Bearer " + key };
    const [stats, latest] = await Promise.all([
      fetch(url + "/rest/v1/place_stats?place_id=eq." + placeId, { headers: H, next: { revalidate: 60 } }).then((r) => r.json()),
      fetch(url + "/rest/v1/place_reviews?place_id=eq." + placeId + "&select=rating,content,verified&order=created_at.desc&limit=2", { headers: H, next: { revalidate: 60 } }).then((r) => r.json()),
    ]);
    return {
      avg: Number(stats?.[0]?.avg_rating ?? 0),
      count: Number(stats?.[0]?.review_count ?? 0),
      latest: Array.isArray(latest) ? latest : [],
    };
  } catch {
    return empty;
  }
}

function mapsHref(p: NonNullable<PlaceInfo>): string | null {
  if (p.maps_url) return p.maps_url;
  if (p.lat != null && p.lng != null) return "https://www.google.com/maps/dir/?api=1&destination=" + p.lat + "," + p.lng;
  if (p.address) return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.address);
  return null;
}

async function getPlace(id: string): Promise<PlaceInfo> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(url + "/rest/v1/places?id=eq." + encodeURIComponent(id) + "&select=id,name,address,maps_url,phone,photos,lat,lng&limit=1", {
      headers: { apikey: key, Authorization: "Bearer " + key },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] ?? null;
  } catch {
    return null;
  }
}

async function getCampaign(id: string): Promise<Campaign | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(url + "/rest/v1/campaigns?id=eq." + encodeURIComponent(id) + "&limit=1", {
      headers: { apikey: key, Authorization: "Bearer " + key },
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Campaign[];
    return data[0] ?? null;
  } catch {
    return null;
  }
}

function Header() {
  return (
    <header className="site">
      <div className="wrap hbar">
        <Logo />
        <AuthButton />
      </div>
    </header>
  );
}

export default async function CampaignPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const id = searchParams?.id ?? "";
  const c = id ? await getCampaign(id) : null;
  const place = c?.place_id ? await getPlace(c.place_id) : null;
  const pr = place ? await getPlaceReviews(place.id) : null;

  if (!c) {
    return (
      <>
        <Header />
        <div className="wrap" style={{ maxWidth: 680, padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🙈</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 14 }}>캠페인을 찾을 수 없어요</h1>
          <p style={{ fontSize: 14, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
            마감되어 내려갔거나, 미리보기용 데이터일 수 있어요.
          </p>
          <Link className="btn pri" style={{ marginTop: 22, padding: "13px 26px" }} href="/">
            홈으로 돌아가기
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="wrap" style={{ maxWidth: 720, paddingTop: 26, paddingBottom: 70 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
          ← 체험단 목록
        </Link>
        {(() => {
          const photos = place?.photos?.length ? place.photos : c.image_url ? [c.image_url] : [];
          const badge =
            c.quota > 0 && c.applied / c.quota >= 0.8
              ? "마감임박"
              : c.created_at && Date.now() - new Date(c.created_at).getTime() < 7 * 86400000
              ? "NEW"
              : null;
          const badgeEl = badge ? (
            <span style={{ position: "absolute", left: 16, top: 16, background: "var(--brand)", color: "#fff", fontSize: 12, fontWeight: 800, borderRadius: 9, padding: "5px 12px" }}>
              {badge}
            </span>
          ) : null;
          if (photos.length > 1)
            return (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 14, scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
                {photos.map((u: string, i: number) => (
                  <div
                    key={u}
                    style={{ flex: "0 0 84%", maxWidth: 520, height: 260, borderRadius: 20, backgroundImage: "url(" + u + ")", backgroundSize: "cover", backgroundPosition: "center", scrollSnapAlign: "start", position: "relative", backgroundColor: "var(--chip)" }}
                  >
                    {i === 0 && badgeEl}
                    <span style={{ position: "absolute", right: 12, bottom: 12, background: "rgba(20,15,10,.6)", color: "#fff", fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: "3px 8px" }}>
                      {i + 1}/{photos.length}
                    </span>
                  </div>
                ))}
              </div>
            );
          return (
            <div
              style={{ marginTop: 14, height: 280, borderRadius: 20, backgroundColor: "var(--chip)", backgroundImage: photos[0] ? "url(" + photos[0] + ")" : undefined, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}
            >
              {badgeEl}
            </div>
          );
        })()}

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--brand-dark)" }}>{c.category}</div>
          <h1 style={{ fontSize: 27, fontWeight: 900, marginTop: 4 }}>{c.store_name}</h1>
          <div style={{ fontSize: 13.5, color: "var(--ink3)", marginTop: 6 }}>
            {c.area ?? "다낭"}
            {" · 1팀 " + (c.party_size ?? 2) + "인 · " + c.quota + "팀 모집"}
            {c.distance_m != null
              ? " · " + (c.distance_m >= 1000 ? (c.distance_m / 1000).toFixed(1) + "km" : c.distance_m + "m")
              : ""}
            {c.today_available ? " · 오늘 가능" : ""}
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            border: "1.5px solid var(--brand)",
            background: "var(--brand-bg)",
            borderRadius: 16,
            padding: "18px 20px",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--brand-dark)" }}>제공 내역</div>
          <div style={{ fontSize: 16.5, fontWeight: 800, marginTop: 5, lineHeight: 1.5 }}>{c.offer}</div>
          {(c.reward_points ?? 0) > 0 && (
            <div style={{ marginTop: 10, display: "inline-block", background: "var(--brand)", color: "#fff", fontSize: 13.5, fontWeight: 900, borderRadius: 10, padding: "7px 13px" }}>
              + 포인트 {Number(c.reward_points).toLocaleString()}P 지급 (리뷰 승인 시)
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--ink2)", marginTop: 8 }}>
            체험 비용은 전액 무료예요. 명시된 한도를 넘는 부분만 직접 결제합니다.
          </div>
        </div>

        {place && (
          <div style={{ marginTop: 14, border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink3)" }}>방문 장소</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <Link href={"/place?id=" + place.id} style={{ fontSize: 15.5, fontWeight: 800, textDecoration: "underline" }}>
                  {place.name}
                </Link>
                {place.address && <div style={{ fontSize: 12.5, color: "var(--ink2)", marginTop: 3 }}>{place.address}</div>}
              </div>
              {mapsHref(place) && (
                <a className="btn pri" style={{ padding: "10px 16px", fontSize: 13, flexShrink: 0 }} href={mapsHref(place)!} target="_blank" rel="noreferrer">
                  구글맵 길찾기
                </a>
              )}
            </div>
            <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              {pr && pr.count > 0 ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>
                    <span style={{ color: "#F59E0B" }}>★ {pr.avg.toFixed(1)}</span>
                    <span style={{ color: "var(--ink3)", fontWeight: 700 }}> 업체 후기 {pr.count}개</span>
                    <Link href={"/place?id=" + place.id} style={{ float: "right", fontSize: 12, color: "var(--brand-dark)", textDecoration: "underline" }}>
                      전체 보기 →
                    </Link>
                  </div>
                  {pr.latest.map((rv, i) => (
                    <div key={i} style={{ marginTop: 8, fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>
                      <span style={{ color: "#F59E0B", fontWeight: 800 }}>{"★".repeat(rv.rating)}</span>
                      {rv.verified && <span style={{ marginLeft: 5, fontSize: 9.5, fontWeight: 900, background: "var(--brand-bg)", color: "var(--brand-dark)", borderRadius: 5, padding: "1px 6px" }}>체험단 인증</span>}
                      <span style={{ marginLeft: 6 }}>{rv.content}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: "var(--ink3)" }}>아직 업체 후기가 없어요 — 첫 후기의 주인공이 되어보세요!</div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink3)" }}>미션</div>
          <div style={{ fontSize: 15.5, fontWeight: 800, marginTop: 5 }}>{c.mission_type} 리뷰 1건 발행</div>
          <ul style={{ fontSize: 13, color: "var(--ink2)", marginTop: 10, paddingLeft: 18, lineHeight: 1.9 }}>
            <li>방문 후 7일 이내 발행 · 발행물 URL 제출</li>
            <li>협찬(경제적 대가) 표기를 제목 또는 본문 첫 부분에 포함</li>
            <li>선정 후 24시간 내 방문 일정 확정 (노쇼 시 이용 제한)</li>
          </ul>
        </div>

        <ApplyButton campaignId={c.id} quota={c.quota} applied={c.applied} />

        <div style={{ marginTop: 18, fontSize: 11.5, color: "var(--ink3)", lineHeight: 1.7 }}>
          신청은 무료이며 선정된 경우에만 방문이 확정됩니다. 이 캠페인의 리뷰는 경제적 대가를 받는
          협찬 콘텐츠로, 발행물에 협찬 표기가 포함됩니다.
        </div>
      </div>
    </>
  );
}
