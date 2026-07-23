"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

type Place = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  area: string;
  address: string;
  maps_url: string;
  phone: string;
  description: string;
  image_url: string | null;
  photos: string[] | null;
};
type Camp = { id: string; offer: string; mission_type: string; quota: number; applied: number; status: string };
type Review = { id: string; user_id: string; rating: number; content: string; verified: boolean; created_at: string; nickname?: string };

function Stars({ n, size = 14, onPick }: { n: number; size?: number; onPick?: (v: number) => void }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={onPick ? () => onPick(i) : undefined}
          style={{ fontSize: size, color: i <= n ? "#F59E0B" : "#E5DED4", cursor: onPick ? "pointer" : "default" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function PlaceDetailPage() {
  const supabase = getSupabase();
  const [id, setId] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get("id");
    setId(pid);
  }, []);

  async function loadReviews(pid: string) {
    if (!supabase) return;
    const { data: r } = await supabase
      .from("place_reviews")
      .select("id, user_id, rating, content, verified, created_at")
      .eq("place_id", pid)
      .order("created_at", { ascending: false });
    let rows = (r as Review[]) ?? [];
    if (rows.length) {
      const ids = Array.from(new Set(rows.map((x) => x.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id, nickname").in("id", ids);
      const nm: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => (nm[p.id] = p.nickname));
      rows = rows.map((x) => ({ ...x, nickname: nm[x.user_id] ?? "익명" }));
    }
    setReviews(rows);
  }

  useEffect(() => {
    if (!id || !supabase) return;
    (async () => {
      const [{ data: p }, { data: c }, sess] = await Promise.all([
        supabase.from("places").select("*").eq("id", id).maybeSingle(),
        supabase.from("campaigns").select("id, offer, mission_type, quota, applied, status").eq("place_id", id).eq("status", "active"),
        supabase.auth.getSession(),
      ]);
      if (!p) {
        setNotFound(true);
        return;
      }
      setPlace(p as Place);
      setCamps((c as Camp[]) ?? []);
      setMe(sess.data.session?.user?.id ?? null);
      loadReviews(id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, supabase]);

  async function submitReview() {
    if (!supabase || !id) return;
    setMsg("");
    if (!me) return setMsg("후기를 남기려면 로그인해주세요.");
    if (rating === 0) return setMsg("별점을 선택해주세요.");
    setBusy(true);
    const { error } = await supabase.rpc("add_place_review", { p_place_id: id, p_rating: rating, p_content: content.trim() });
    setBusy(false);
    if (error) return setMsg(error.message);
    setRating(0);
    setContent("");
    setMsg("후기가 등록됐어요!");
    loadReviews(id);
  }

  if (notFound)
    return (
      <div className="wrap" style={{ paddingTop: 40, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>업체를 찾을 수 없어요</div>
        <Link className="btn pri" style={{ marginTop: 16, padding: "12px 22px" }} href="/places">
          업체 목록으로
        </Link>
      </div>
    );
  if (!place) return <div className="wrap" style={{ paddingTop: 40, color: "var(--ink3)" }}>불러오는 중…</div>;

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const verifiedCount = reviews.filter((r) => r.verified).length;

  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 20, paddingBottom: 90 }}>
      <Link href="/places" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 업체 목록
      </Link>

      {(place.photos ?? []).length > 1 ? (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 14, scrollSnapType: "x mandatory" }} className="regionrow">
          {(place.photos ?? []).map((u) => (
            <div
              key={u}
              style={{ flex: "0 0 82%", maxWidth: 460, height: 200, borderRadius: 18, backgroundImage: "url(" + u + ")", backgroundSize: "cover", backgroundPosition: "center", scrollSnapAlign: "start" }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            marginTop: 14,
            height: 180,
            borderRadius: 18,
            backgroundColor: "var(--chip)",
            backgroundImage: place.image_url ? "url(" + place.image_url + ")" : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--brand-dark)" }}>
          {place.category}
          {place.subcategory ? " · " + place.subcategory : ""} · {place.area}
        </div>
        <h1 style={{ fontSize: 23, fontWeight: 900, marginTop: 4 }}>{place.name}</h1>
        <div style={{ marginTop: 6, fontSize: 14 }}>
          <Stars n={Math.round(avg)} size={16} />
          <b style={{ marginLeft: 6 }}>{avg ? avg.toFixed(1) : "-"}</b>
          <span style={{ color: "var(--ink3)", fontSize: 12.5 }}>
            {" "}
            후기 {reviews.length}개 {verifiedCount > 0 ? `(체험단 인증 ${verifiedCount})` : ""}
          </span>
        </div>
        {place.description && (
          <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 10, lineHeight: 1.7 }}>{place.description}</p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        {place.maps_url && (
          <a className="btn pri" style={{ padding: "11px 18px", fontSize: 13.5 }} href={place.maps_url} target="_blank" rel="noreferrer">
            지도에서 보기
          </a>
        )}
        {place.phone && (
          <a className="btn ghost" style={{ padding: "11px 18px", fontSize: 13.5 }} href={"tel:" + place.phone}>
            전화하기
          </a>
        )}
      </div>
      {place.address && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--ink2)" }}>주소: {place.address}</div>
      )}

      {camps.length > 0 && (
        <>
          <h2 style={{ fontSize: 17, fontWeight: 900, marginTop: 28 }}>진행 중인 체험단</h2>
          {camps.map((c) => (
            <Link
              key={c.id}
              href={"/campaign?id=" + c.id}
              style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--brand)", background: "var(--brand-bg)", borderRadius: 14, padding: "13px 16px", marginTop: 10 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{c.offer}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink2)", marginTop: 3 }}>
                  {c.mission_type} · 신청 {c.applied}/{c.quota}
                </div>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 900, color: "var(--brand-dark)", flexShrink: 0 }}>신청하기 ›</span>
            </Link>
          ))}
        </>
      )}

      <h2 style={{ fontSize: 17, fontWeight: 900, marginTop: 28 }}>후기 {reviews.length}</h2>

      <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", marginTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>별점 남기기</div>
        <div style={{ marginTop: 6 }}>
          <Stars n={rating} size={26} onPick={setRating} />
        </div>
        <textarea
          style={{ width: "100%", border: "1.5px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", outline: "none", background: "#fff", minHeight: 60, marginTop: 8, resize: "vertical" }}
          placeholder="이 업체는 어땠나요? (선택)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {msg && <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: msg.includes("등록됐") ? "#1FA45B" : "#C0392B" }}>{msg}</div>}
        <button className="btn pri" style={{ marginTop: 10, padding: "10px 18px", fontSize: 13 }} onClick={submitReview} disabled={busy}>
          {busy ? "등록 중…" : "후기 등록"}
        </button>
      </div>

      {reviews.map((r) => (
        <div key={r.id} style={{ borderBottom: "1px solid var(--line)", padding: "14px 2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <b style={{ fontSize: 13.5 }}>{r.nickname}</b>
            {r.verified && (
              <span style={{ fontSize: 10, fontWeight: 900, background: "var(--brand-bg)", color: "var(--brand-dark)", borderRadius: 6, padding: "2px 7px" }}>
                체험단 인증
              </span>
            )}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink3)" }}>
              {new Date(r.created_at).toLocaleDateString("ko-KR")}
            </span>
          </div>
          <div style={{ marginTop: 4 }}>
            <Stars n={r.rating} />
          </div>
          {r.content && <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 6, lineHeight: 1.65 }}>{r.content}</p>}
        </div>
      ))}
      {reviews.length === 0 && (
        <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink3)" }}>첫 후기를 남겨보세요!</div>
      )}
    </div>
  );
}
