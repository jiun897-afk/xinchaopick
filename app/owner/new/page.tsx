"use client";

import { useState } from "react";
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
  const [store, setStore] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [offer, setOffer] = useState("");
  const [mission, setMission] = useState(MISSIONS[0]);
  const [quota, setQuota] = useState(5);
  const [area, setArea] = useState(AREAS[0]);
  const [today, setToday] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    if (!store.trim()) return setErr("가게 이름을 입력해주세요.");
    if (!offer.trim()) return setErr("제공 내역을 입력해주세요. (예: 2인 식사 40만동 한도 · 음료 포함)");
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
      store_name: store.trim(),
      category,
      offer: offer.trim(),
      mission_type: mission,
      quota,
      area,
      today_available: today,
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

      <label style={labelStyle}>가게 이름</label>
      <input style={inputStyle} value={store} onChange={(e) => setStore(e.target.value)} placeholder="예: 허벌 스파 다낭" />

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
          <label style={labelStyle}>모집 인원</label>
          <select style={inputStyle} value={quota} onChange={(e) => setQuota(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}명
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>지역</label>
          <select style={inputStyle} value={area} onChange={(e) => setArea(e.target.value)}>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={today} onChange={(e) => setToday(e.target.checked)} style={{ width: 18, height: 18 }} />
        오늘 방문 가능 (당일 예약 허용)
      </label>

      <div style={{ background: "var(--chip)", borderRadius: 12, padding: "12px 14px", fontSize: 11.5, color: "var(--ink2)", lineHeight: 1.6, marginTop: 14 }}>
        대표 사진은 카테고리 기본 이미지로 자동 설정돼요 (직접 업로드는 곧 지원). 등록 후 신청자가 생기면
        사장님 센터에서 선정할 수 있어요.
      </div>

      {err && <div style={{ marginTop: 12, fontSize: 13, color: "#C0392B", fontWeight: 700 }}>{err}</div>}

      <button className="btn pri" style={{ width: "100%", padding: "15px 0", fontSize: 16, marginTop: 16, borderRadius: 14 }} onClick={submit} disabled={busy}>
        {busy ? "등록 중…" : "캠페인 등록하기"}
      </button>
    </div>
  );
}
