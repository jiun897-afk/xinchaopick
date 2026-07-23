"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import { PLACE_CATS } from "../../lib/placeCats";

type Place = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  area: string;
  address: string;
  image_url: string | null;
};
type Stat = { place_id: string; review_count: number; avg_rating: number };

const SORTS = [
  { v: "rating", t: "별점순" },
  { v: "reviews", t: "후기순" },
  { v: "new", t: "최신순" },
];

export default function PlacesPage() {
  const supabase = getSupabase();
  const [list, setList] = useState<Place[] | null>(null);
  const [stats, setStats] = useState<Record<string, Stat>>({});
  const [cat, setCat] = useState("전체");
  const [sub, setSub] = useState("전체");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("rating");

  useEffect(() => {
    if (!supabase) {
      setList([]);
      return;
    }
    (async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("places").select("id, name, category, subcategory, area, address, image_url").order("created_at", { ascending: false }),
        supabase.from("place_stats").select("*"),
      ]);
      setList((p as Place[]) ?? []);
      const m: Record<string, Stat> = {};
      ((s as Stat[]) ?? []).forEach((x) => (m[x.place_id] = x));
      setStats(m);
    })();
  }, [supabase]);

  const filtered = useMemo(() => {
    let r = list ?? [];
    if (cat !== "전체") r = r.filter((p) => p.category === cat);
    if (sub !== "전체") r = r.filter((p) => p.subcategory === sub);
    if (q.trim()) r = r.filter((p) => (p.name + p.address + p.subcategory).toLowerCase().includes(q.trim().toLowerCase()));
    const st = (id: string) => stats[id] ?? { review_count: 0, avg_rating: 0 };
    if (sort === "rating") r = [...r].sort((a, b) => Number(st(b.id).avg_rating) - Number(st(a.id).avg_rating));
    if (sort === "reviews") r = [...r].sort((a, b) => st(b.id).review_count - st(a.id).review_count);
    return r;
  }, [list, cat, sub, q, sort, stats]);

  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 90 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>다낭 업체 찾기</h1>
      <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
        체험단이 실제로 다녀간 곳 — 인증 후기로 믿을 수 있어요
      </div>

      <input
        style={{ width: "100%", border: "1.5px solid var(--line)", borderRadius: 14, padding: "13px 16px", fontSize: 14.5, fontFamily: "inherit", outline: "none", background: "#fff", marginTop: 14 }}
        placeholder="업체명, 지역, 업종 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="chips" style={{ marginTop: 12 }}>
        {["전체", ...Object.keys(PLACE_CATS)].map((c) => (
          <span
            key={c}
            className={"chip" + (cat === c ? " on" : "")}
            style={{ cursor: "pointer" }}
            onClick={() => {
              setCat(c);
              setSub("전체");
            }}
          >
            {c}
          </span>
        ))}
      </div>
      {cat !== "전체" && (PLACE_CATS[cat] ?? []).length > 0 && (
        <div className="chips" style={{ marginTop: 6 }}>
          {["전체", ...PLACE_CATS[cat]].map((s) => (
            <span key={s} className={"chip" + (sub === s ? " on" : "")} style={{ cursor: "pointer", fontSize: 12 }} onClick={() => setSub(s)}>
              {s}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {SORTS.map((s) => (
          <span
            key={s.v}
            onClick={() => setSort(s.v)}
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "6px 12px",
              borderRadius: 20,
              cursor: "pointer",
              background: sort === s.v ? "var(--ink)" : "var(--chip)",
              color: sort === s.v ? "#fff" : "var(--ink2)",
            }}
          >
            {s.t}
          </span>
        ))}
      </div>

      {list === null && <div style={{ marginTop: 24, fontSize: 14, color: "var(--ink3)" }}>불러오는 중…</div>}

      {list !== null && filtered.length === 0 && (
        <div style={{ marginTop: 30, textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>아직 등록된 업체가 없어요</div>
          <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 6, lineHeight: 1.7 }}>
            사장님이라면 지금 무료로 업체를 등록해보세요!
          </p>
          <Link className="btn pri" style={{ marginTop: 14, padding: "12px 22px" }} href="/owner/places">
            내 업체 등록하기 (무료)
          </Link>
        </div>
      )}

      {filtered.map((p) => {
        const st = stats[p.id] ?? { review_count: 0, avg_rating: 0 };
        return (
          <Link
            key={p.id}
            href={"/place?id=" + p.id}
            style={{ display: "flex", gap: 14, alignItems: "center", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", marginTop: 12 }}
          >
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: 14,
                backgroundColor: "var(--chip)",
                backgroundImage: p.image_url ? "url(" + p.image_url + ")" : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--brand-dark)" }}>
                {p.category}
                {p.subcategory ? " · " + p.subcategory : ""}
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 800, marginTop: 2 }}>{p.name}</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>
                <b style={{ color: "#F59E0B" }}>★ {Number(st.avg_rating).toFixed(1)}</b>
                <span style={{ color: "var(--ink3)" }}>
                  {" "}
                  ({st.review_count}) · {p.area}
                  {p.address ? " · " + p.address : ""}
                </span>
              </div>
            </div>
            <span style={{ color: "var(--ink3)" }}>›</span>
          </Link>
        );
      })}
    </div>
  );
}
