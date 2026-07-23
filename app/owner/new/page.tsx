"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../../lib/supabase";

const CATEGORIES = ["로컬맛집", "한식", "마사지·스파", "카페·디저트", "네일·뷰티", "투어·액티비티", "사진·스냅", "숙소·풀빌라", "기타"];
const MISSIONS = ["네이버 블로그", "유튜브 쇼츠", "네이버 클립", "인스타그램", "영상"];
const AREAS = ["미케비치", "안탕", "시내", "한시장", "호이안", "기타"];

const DEFAULT_IMG: Record<string, string> = {
  "로컬맛집": "https://images.unsplash.com/photo-1597345637412-9fd611e758f3?w=800&q=75&fm=jpg&fit=crop",
  "한식": "https://images.unsplash.com/photo-1632558610168-8377309e34c7?w=800&q=75&fm=jpg&fit=crop",
  "마사지·스파": "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=75&fm=jpg&fit=crop",
  "카페·디저트": "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&q=75&fm=jpg&fit=crop",
  "투어·액티비티": "https://images.unsplash.com/photo-1722987170598-556327f43fc7?w=800&q=75&fm=jpg&fit=crop",
};

const PLACE_TO_CAMPAIGN_CAT: Record<string, string> = {
  "음식점": "로컬맛집",
  "카페·디저트": "카페·디저트",
  "마사지·스파": "마사지·스파",
  "병원·의료": "기타",
  "투어·액티비티": "투어·액티비티",
  "숙소": "숙소·풀빌라",
  "기타": "기타",
};

type MyPlace = { id: string; name: string; category: string; area: string; image_url: string | null };

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--line)",
  borderRadius: 12,
  padding: "13px 14px",
  fontSize: 14.5,
  fontFamily: "inherit",
  outline: "none",
  background: "#fff",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 800, margin: "18px 0 7px" };

export default function NewCampaignPage() {
  const supabase = getSupabase();
  const router = useRouter();
  const [places, setPlaces] = useState<MyPlace[] | null>(null);
  const [placeId, setPlaceId] = useState("");
  const [credit, setCredit] = useState(0);
  const [store, setStore] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [offer, setOffer] = useState("");
  const [mission, setMission] = useState(MISSIONS[0]);
  const [quota, setQuota] = useState(5);
  const [party, setParty] = useState(2);
  const [area, setArea] = useState(AREAS[0]);
  const [today, setToday] = useState(false);
  const [rewardType, setRewardType] = useState<"free" | "point">("free");
  const [rewardInput, setRewardInput] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setPlaces([]);
        return;
      }
      const [{ data: pl }, { data: w }] = await Promise.all([
        supabase.from("places").select("id, name, category, area, image_url").eq("owner_id", session.user.id).order("created_at", { ascending: false }),
        supabase.from("owner_wallets").select("balance").maybeSingle(),
      ]);
      setPlaces((pl as MyPlace[]) ?? []);
      setCredit((w as any)?.balance ?? 0);
    })();
  }, [supabase]);

  function pickPlace(id: string) {
    setPlaceId(id);
    const p = (places ?? []).find((x) => x.id === id);
    if (p) {
      setStore(p.name);
      setCategory(PLACE_TO_CAMPAIGN_CAT[p.category] ?? "기타");
      setArea(AREAS.includes(p.area) ? p.area : "기타");
    }
  }

  const rewardPoints = Number(rewardInput.replace(/[^0-9]/g, "")) || 0;
  const needed = rewardType === "point" ? rewardPoints * quota : 0;
  const lack = needed > credit;

  async function submit() {
    setErr("");
    if (!placeId) return setErr("어느 업체의 캠페인인지 선택해주세요.");
    if (!store.trim()) return setErr("가게 이름을 입력해주세요.");
    if (!offer.trim()) return setErr("제공 내역을 입력해주세요. (예: 2인 식사 40만동 한도 · 음료 포함)");
    if (rewardType === "point" && rewardPoints < 1000) return setErr("지급 포인트는 1,000P 이상으로 입력해주세요.");
    if (rewardType === "point" && lack) return setErr("크레딧이 부족해요. 충전 후 등록할 수 있어요.");
    if (!supabase) return setErr("서버 연결이 아직 준비되지 않았어요.");
    setBusy(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setBusy(false);
      return setErr("로그인 후 등록할 수 있어요.");
    }
    const { error } = await supabase.from("campaigns").insert({
      owner_id: session.user.id,
      place_id: placeId,
      store_name: store.trim(),
      category,
      offer: offer.trim(),
      mission_type: mission,
      quota,
      party_size: party,
      area,
      today_available: today,
      reward_points: rewardType === "point" ? rewardPoints : 0,
      badge: "NEW",
      status: "active",
      image_url: DEFAULT_IMG[category] ?? DEFAULT_IMG["로컬맛집"],
    });
    setBusy(false);
    if (error) return setErr("등록 중 문제가 생겼어요: " + error.message);
    router.push("/owner");
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/owner" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 사장님 센터
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>새 캠페인 등록</h1>
      <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 4 }}>
        조건은 전부 사장님이 정해요. 등록 즉시 홈에 노출됩니다.
      </div>

      <label style={labelStyle}>어느 업체의 캠페인인가요?</label>
      {places === null && <div style={{ fontSize: 13, color: "var(--ink3)" }}>업체 불러오는 중…</div>}
      {places !== null && places.length === 0 && (
        <div style={{ background: "var(--brand-bg)", borderRadius: 12, padding: "14px 16px", fontSize: 13.5, lineHeight: 1.7 }}>
          먼저 업체를 등록해야 캠페인을 열 수 있어요.
          <br />
          <Link href="/owner/places" style={{ fontWeight: 900, color: "var(--brand-dark)", textDecoration: "underline" }}>
            내 업체 등록하러 가기 →
          </Link>
        </div>
      )}
      {places !== null && places.length > 0 && (
        <select style={inputStyle} value={placeId} onChange={(e) => pickPlace(e.target.value)}>
          <option value="">업체 선택</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.category} · {p.area})
            </option>
          ))}
        </select>
      )}
      <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 5 }}>
        업체가 여러 개면 각각 등록해두고 골라 쓰면 돼요.{" "}
        <Link href="/owner/places" style={{ textDecoration: "underline" }}>
          업체 관리
        </Link>
      </div>

      <label style={labelStyle}>캠페인 표시 이름</label>
      <input style={inputStyle} value={store} onChange={(e) => setStore(e.target.value)} placeholder="업체 선택 시 자동 입력 (지점명 등 수정 가능)" />

      <label style={labelStyle}>카테고리</label>
      <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      <label style={labelStyle}>제공 내역 (무엇을, 얼마 한도로)</label>
      <input
        style={inputStyle}
        value={offer}
        onChange={(e) => setOffer(e.target.value)}
        placeholder="예: 아로마 90분 2인 · 70만동 한도 · 팁 포함"
      />

      <label style={labelStyle}>미션 (리뷰어가 발행할 콘텐츠)</label>
      <select style={inputStyle} value={mission} onChange={(e) => setMission(e.target.value)}>
        {MISSIONS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>모집 팀 수</label>
          <select style={inputStyle} value={quota} onChange={(e) => setQuota(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}팀
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>1팀당 인원 (동반 포함)</label>
          <select style={inputStyle} value={party} onChange={(e) => setParty(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "1명 (혼자 방문)" : n + "명까지"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label style={labelStyle}>지역</label>
      <select style={inputStyle} value={area} onChange={(e) => setArea(e.target.value)}>
        {AREAS.map((a) => (
          <option key={a}>{a}</option>
        ))}
      </select>

      <label style={labelStyle}>보상 방식</label>
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { v: "free" as const, t: "무료 체험 제공", d: "체험 제공이 보상 (기본)" },
          { v: "point" as const, t: "체험 + 포인트 지급", d: "리뷰 승인 시 포인트 지급" },
        ].map((o) => (
          <div
            key={o.v}
            onClick={() => setRewardType(o.v)}
            style={{
              flex: 1,
              border: rewardType === o.v ? "2px solid var(--brand)" : "1.5px solid var(--line)",
              background: rewardType === o.v ? "var(--brand-bg)" : "#fff",
              borderRadius: 12,
              padding: "12px 13px",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>{o.t}</div>
            <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 3 }}>{o.d}</div>
          </div>
        ))}
      </div>

      {rewardType === "point" && (
        <>
          <label style={labelStyle}>리뷰어 1명당 지급 포인트 (1P = 1원)</label>
          <input
            style={inputStyle}
            inputMode="numeric"
            value={rewardInput}
            onChange={(e) => setRewardInput(e.target.value)}
            placeholder="예: 30000"
          />
          <div
            style={{
              background: lack ? "#FDECEA" : "var(--brand-bg)",
              borderRadius: 10,
              padding: "11px 14px",
              fontSize: 12.5,
              lineHeight: 1.7,
              marginTop: 10,
              fontWeight: 700,
              color: lack ? "#C0392B" : "var(--brand-dark)",
            }}
          >
            필요 크레딧: {needed.toLocaleString()}P ({rewardPoints.toLocaleString()}P × {quota}명)
            <br />
            내 보유 크레딧: {credit.toLocaleString()}P
            {lack && (
              <>
                {" "}
                — 부족해요!{" "}
                <Link href="/owner/topup" style={{ textDecoration: "underline", fontWeight: 900 }}>
                  충전하러 가기 →
                </Link>
              </>
            )}
          </div>
        </>
      )}

      <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={today} onChange={(e) => setToday(e.target.checked)} style={{ width: 18, height: 18 }} />
        오늘 방문 가능 (당일 예약 허용)
      </label>

      <div style={{ background: "var(--chip)", borderRadius: 12, padding: "12px 14px", fontSize: 11.5, color: "var(--ink2)", lineHeight: 1.6, marginTop: 14 }}>
        대표 사진은 카테고리 기본 이미지로 자동 설정돼요 (직접 업로드는 곧 지원). 포인트는 리뷰를 승인하는
        순간 크레딧에서 차감되어 리뷰어에게 지급돼요.
      </div>

      {err && <div style={{ marginTop: 12, fontSize: 13, color: "#C0392B", fontWeight: 700 }}>{err}</div>}

      <button
        className="btn pri"
        style={{ width: "100%", padding: "15px 0", fontSize: 16, marginTop: 16, borderRadius: 14, opacity: rewardType === "point" && lack ? 0.5 : 1 }}
        onClick={submit}
        disabled={busy || (rewardType === "point" && lack)}
      >
        {busy ? "등록 중…" : rewardType === "point" && lack ? "크레딧 부족 — 충전 후 등록 가능" : "캠페인 등록하기"}
      </button>
    </div>
  );
}
