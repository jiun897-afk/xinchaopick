"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

type Camp = { id: string; store_name: string; category: string; offer: string; image_url: string | null; applied: number; quota: number; mission_type: string; camp_type: string | null; reward_points: number | null };
type Place = { id: string; name: string; category: string; subcategory: string; area: string; image_url: string | null };

export default function SearchPage() {
  const supabase = getSupabase();
  const [q, setQ] = useState("");
  const [input, setInput] = useState("");
  const [scope, setScope] = useState("all");
  const [camps, setCamps] = useState<Camp[] | null>(null);
  const [places, setPlaces] = useState<Place[] | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const initial = sp.get("q") ?? "";
    setQ(initial);
    setInput(initial);
    const sc = sp.get("scope");
    if (sc === "campaign" || sc === "place") setScope(sc);
  }, []);

  useEffect(() => {
    if (!q.trim() || !supabase) {
      setCamps([]);
      setPlaces([]);
      return;
    }
    const like = "%" + q.trim() + "%";
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id, store_name, category, offer, image_url, applied, quota, mission_type, camp_type, reward_points")
          .eq("status", "active")
          .or(`store_name.ilike.${like},offer.ilike.${like},category.ilike.${like},area.ilike.${like},mission_type.ilike.${like},camp_type.ilike.${like}`)
          .limit(20),
        supabase
          .from("places")
          .select("id, name, category, subcategory, area, image_url")
          .or(`name.ilike.${like},subcategory.ilike.${like},category.ilike.${like},address.ilike.${like}`)
          .limit(20),
      ]);
      setCamps((c as Camp[]) ?? []);
      setPlaces((p as Place[]) ?? []);
    })();
  }, [q, supabase]);

  function go() {
    setQ(input);
    const u = new URL(window.location.href);
    u.searchParams.set("q", input);
    window.history.replaceState(null, "", u.toString());
  }

  const empty = camps !== null && places !== null && camps.length === 0 && places.length === 0;

  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 22, paddingBottom: 90 }}>
      <Link href="/" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 홈으로
      </Link>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--line)", borderRadius: 999, padding: "13px 18px", fontSize: 14.5, fontFamily: "inherit", outline: "none", background: "#fff" }}
          placeholder="맛집, 마사지, 업체 이름 검색"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          autoFocus
        />
        <button className="btn pri" style={{ padding: "0 20px", fontSize: 14, borderRadius: 999, flexShrink: 0 }} onClick={go}>
          검색
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
        {[
          { v: "all", t: "전체" },
          { v: "campaign", t: "체험단" },
          { v: "place", t: "업체" },
        ].map((s) => (
          <span
            key={s.v}
            onClick={() => setScope(s.v)}
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              padding: "7px 14px",
              borderRadius: 999,
              cursor: "pointer",
              background: scope === s.v ? "var(--ink)" : "var(--chip)",
              color: scope === s.v ? "#fff" : "var(--ink2)",
            }}
          >
            {s.t}
          </span>
        ))}
      </div>

      {q.trim() && (
        <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink3)" }}>
          &ldquo;<b style={{ color: "var(--ink)" }}>{q}</b>&rdquo; 검색 결과
        </div>
      )}

      {empty && q.trim() && (
        <div style={{ marginTop: 30, textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>검색 결과가 없어요</div>
          <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 6 }}>다른 키워드로 검색해보세요 (예: 마사지, 한식, 스냅)</p>
        </div>
      )}

      {scope !== "place" && camps !== null && camps.length > 0 && (
        <>
          <h2 style={{ fontSize: 16.5, fontWeight: 900, marginTop: 22 }}>체험단 캠페인 {camps.length}</h2>
          {camps.map((c) => (
            <Link key={c.id} href={"/campaign?id=" + c.id} style={{ display: "flex", gap: 13, alignItems: "center", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px", marginTop: 10 }}>
              <div style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: "var(--chip)", backgroundImage: c.image_url ? "url(" + c.image_url + ")" : undefined, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--brand-dark)" }}>
                  <span
                    style={{
                      background: c.camp_type === "기자단" ? "#EEEAFF" : "var(--brand-bg)",
                      color: c.camp_type === "기자단" ? "#6D28D9" : "var(--brand-dark)",
                      borderRadius: 5,
                      padding: "1px 6px",
                      marginRight: 5,
                      fontSize: 10,
                    }}
                  >
                    {c.camp_type === "기자단" ? "기자단" : "체험단"}
                  </span>
                  {c.category} · {c.mission_type}
                  {(c.reward_points ?? 0) > 0 && <span style={{ marginLeft: 5, color: "var(--brand-dark)" }}>+{Number(c.reward_points).toLocaleString()}P</span>}
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 800 }}>{c.store_name}</div>
                <div style={{ fontSize: 12, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.offer}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink3)", flexShrink: 0 }}>
                {c.applied}/{c.quota}
              </span>
            </Link>
          ))}
        </>
      )}

      {scope !== "campaign" && places !== null && places.length > 0 && (
        <>
          <h2 style={{ fontSize: 16.5, fontWeight: 900, marginTop: 26 }}>업체 {places.length}</h2>
          {places.map((p) => (
            <Link key={p.id} href={"/place?id=" + p.id} style={{ display: "flex", gap: 13, alignItems: "center", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px", marginTop: 10 }}>
              <div style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: "var(--chip)", backgroundImage: p.image_url ? "url(" + p.image_url + ")" : undefined, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--brand-dark)" }}>
                  {p.category}
                  {p.subcategory ? " · " + p.subcategory : ""}
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 800 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink2)" }}>{p.area}</div>
              </div>
              <span style={{ color: "var(--ink3)" }}>›</span>
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
