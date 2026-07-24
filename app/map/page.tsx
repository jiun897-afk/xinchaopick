"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import { loadLeaflet, DANANG } from "../../lib/leaflet";
import { distM, fmtDist } from "../../lib/geo";

type P = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  area: string;
  lat: number;
  lng: number;
  image_url: string | null;
};
type Stat = { place_id: string; review_count: number; avg_rating: number };
type Camp = { place_id: string; mission_type: string; today_available: boolean | null; camp_type: string | null };

const CH_SHORT: Record<string, string> = {
  "네이버 블로그": "블로그",
  "네이버 클립": "클립",
  "유튜브 롱폼": "유튜브",
  "유튜브 쇼츠": "쇼츠",
  "인스타그램": "인스타",
  "인스타 릴스": "릴스",
  "틱톡": "틱톡",
  "페이스북": "페북",
  "스레드": "스레드",
  "X(엑스)": "X",
  "영상": "유튜브",
};
const SNS_OPTS = ["전체", "블로그", "클립", "유튜브", "쇼츠", "인스타", "릴스", "틱톡", "페북", "스레드", "X", "기자단"];

function inVietnam(lat: number, lng: number) {
  return lat > 8 && lat < 24 && lng > 101.5 && lng < 110.5;
}

export default function MapPage() {
  const supabase = getSupabase();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const meRef = useRef<any>(null);
  const posRef = useRef<{ lat: number; lng: number } | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [noGeo, setNoGeo] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [rows, setRows] = useState<P[] | null>(null);
  const [stats, setStats] = useState<Record<string, Stat>>({});
  const [camps, setCamps] = useState<Record<string, { n: number; today: boolean; chs: string[]; jj: boolean }>>({});
  const [sort, setSort] = useState("near");
  const [cat, setCat] = useState("전체");
  const [sns, setSns] = useState("전체");

  function locate(fly: boolean) {
    if (!navigator.geolocation) {
      setNoGeo(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: la, longitude: ln } = p.coords;
        posRef.current = { lat: la, lng: ln };
        setPos({ lat: la, lng: ln });
        const L = (window as any).L;
        const map = mapRef.current;
        if (!L || !map) return;
        if (meRef.current) meRef.current.setLatLng([la, ln]);
        else {
          meRef.current = L.circleMarker([la, ln], { radius: 8, color: "#fff", fillColor: "#1A73E8", fillOpacity: 1, weight: 3 })
            .addTo(map)
            .bindPopup("내 위치");
        }
        if (fly || inVietnam(la, ln)) map.setView([la, ln], 14);
      },
      () => setNoGeo(true),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  useEffect(() => {
    let dead = false;
    loadLeaflet().then(async (L) => {
      if (dead || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, { zoomControl: false }).setView(DANANG, 13);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      mapRef.current = map;
      locate(false);

      if (!supabase) {
        setRows([]);
        return;
      }
      const [{ data: pl }, { data: st }, { data: cp }] = await Promise.all([
        supabase.from("places").select("id, name, category, subcategory, area, lat, lng, image_url").not("lat", "is", null),
        supabase.from("place_stats").select("*"),
        supabase.from("campaigns").select("place_id, mission_type, today_available, camp_type").eq("status", "active").not("place_id", "is", null),
      ]);
      const sm: Record<string, Stat> = {};
      ((st as Stat[]) ?? []).forEach((x) => (sm[x.place_id] = x));
      setStats(sm);
      const cm: Record<string, { n: number; today: boolean; chs: string[]; jj: boolean }> = {};
      ((cp as Camp[]) ?? []).forEach((c) => {
        const e = (cm[c.place_id] = cm[c.place_id] ?? { n: 0, today: false, chs: [], jj: false });
        e.n += 1;
        if (c.today_available) e.today = true;
        if (c.camp_type === "기자단") e.jj = true;
        const s = CH_SHORT[c.mission_type] ?? c.mission_type;
        if (!e.chs.includes(s)) e.chs.push(s);
      });
      setCamps(cm);
      const list = (pl as P[]) ?? [];
      setRows(list);
      list.forEach((p) => {
        const s = sm[p.id] ?? { review_count: 0, avg_rating: 0 };
        const cInfo = cm[p.id];
        L.circleMarker([p.lat, p.lng], { radius: 10, color: "#fff", fillColor: "#F04E1A", fillOpacity: 0.95, weight: 2.5 })
          .addTo(map)
          .bindPopup(() => {
            const my = posRef.current;
            const d = my ? distM(my.lat, my.lng, p.lat, p.lng) : null;
            return (
              '<div style="font-family:inherit;min-width:150px">' +
              '<b style="font-size:14px">' + p.name + "</b><br/>" +
              '<span style="font-size:11.5px;color:#777">' + p.category + (p.subcategory ? " · " + p.subcategory : "") + "</span><br/>" +
              '<span style="font-size:12px;color:#F59E0B;font-weight:800">★ ' + Number(s.avg_rating).toFixed(1) + "</span>" +
              '<span style="font-size:11px;color:#999"> (' + s.review_count + ")</span>" +
              (d !== null ? '<span style="font-size:11.5px;color:#D9420F;font-weight:800"> · 내 위치에서 ' + fmtDist(d) + "</span>" : "") +
              "<br/>" +
              (cInfo ? '<span style="font-size:11px;color:#1FA45B;font-weight:800">체험단 ' + cInfo.n + "개 모집중" + (cInfo.today ? " · 오늘 가능" : "") + "</span><br/>" : "") +
              '<a href="/place?id=' + p.id + '" style="font-size:12.5px;font-weight:800;color:#D9420F">자세히 보기 →</a></div>'
            );
          });
      });
    });
    return () => {
      dead = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        meRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const cats = useMemo(() => {
    const s = new Set<string>();
    (rows ?? []).forEach((p) => s.add(p.category));
    return ["전체", ...Array.from(s)];
  }, [rows]);

  const listed = useMemo(() => {
    let r = rows ?? [];
    if (cat !== "전체") r = r.filter((p) => p.category === cat);
    if (sns !== "전체") {
      r = r.filter((p) => {
        const c = camps[p.id];
        if (!c) return false;
        return sns === "기자단" ? c.jj : c.chs.includes(sns);
      });
    }
    const st = (id: string) => stats[id] ?? { review_count: 0, avg_rating: 0 };
    const dist = (p: P) => (pos ? distM(pos.lat, pos.lng, p.lat, p.lng) : Infinity);
    const reco = (p: P) => Number(st(p.id).avg_rating) + Math.log10(st(p.id).review_count + 1);
    if (sort === "near" && pos) r = [...r].sort((a, b) => dist(a) - dist(b));
    else if (sort === "today")
      r = [...r].sort((a, b) => {
        const ta = camps[a.id]?.today ? 1 : 0;
        const tb = camps[b.id]?.today ? 1 : 0;
        if (tb !== ta) return tb - ta;
        return pos ? dist(a) - dist(b) : reco(b) - reco(a);
      });
    else r = [...r].sort((a, b) => reco(b) - reco(a));
    return r;
  }, [rows, cat, sns, sort, pos, stats, camps]);

  const chip = (on: boolean): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 800,
    padding: "7px 13px",
    borderRadius: 999,
    cursor: "pointer",
    flexShrink: 0,
    background: on ? "var(--ink)" : "#fff",
    color: on ? "#fff" : "var(--ink2)",
    border: on ? "1px solid var(--ink)" : "1px solid var(--line)",
  });
  const selStyle: React.CSSProperties = {
    border: "1px solid var(--line)",
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "inherit",
    background: "#fff",
    color: "var(--ink2)",
    outline: "none",
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 500, display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", fontSize: 14, fontWeight: 900, boxShadow: "0 2px 12px rgba(0,0,0,.12)" }}>
          주변 체험 지도
          {rows !== null && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink3)", marginLeft: 7 }}>업체 {rows.length}곳</span>}
        </div>
        <div
          onClick={() => setView((v) => (v === "map" ? "list" : "map"))}
          style={{
            marginLeft: "auto",
            background: "var(--brand)",
            color: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 12.5,
            fontWeight: 800,
            boxShadow: "0 2px 12px rgba(240,78,26,.3)",
            cursor: "pointer",
          }}
        >
          {view === "map" ? "목록 보기 ≡" : "지도 보기 🗺"}
        </div>
      </div>

      <div ref={ref} style={{ height: "calc(100dvh - 132px)", minHeight: 420, zIndex: 0 }} />

      {view === "map" && (
        <button
          onClick={() => locate(true)}
          aria-label="내 위치"
          style={{
            position: "absolute",
            right: 14,
            bottom: 96,
            zIndex: 500,
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: "#fff",
            boxShadow: "0 2px 12px rgba(0,0,0,.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" />
          </svg>
        </button>
      )}

      {view === "list" && (
        <div
          style={{
            position: "absolute",
            top: 62,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 490,
            background: "#FAF8F5",
            overflowY: "auto",
            padding: "10px 12px 24px",
            borderRadius: "18px 18px 0 0",
          }}
        >
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }} className="regionrow">
            <span style={chip(sort === "near")} onClick={() => { setSort("near"); if (!pos) locate(false); }}>
              📍 가까운순
            </span>
            <span style={chip(sort === "today")} onClick={() => setSort("today")}>
              오늘 가능순
            </span>
            <span style={chip(sort === "reco")} onClick={() => setSort("reco")}>
              추천순
            </span>
            <select style={selStyle} value={cat} onChange={(e) => setCat(e.target.value)}>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c === "전체" ? "업종 전체" : c}
                </option>
              ))}
            </select>
            <select style={selStyle} value={sns} onChange={(e) => setSns(e.target.value)}>
              {SNS_OPTS.map((c) => (
                <option key={c} value={c}>
                  {c === "전체" ? "SNS 전체" : c}
                </option>
              ))}
            </select>
          </div>

          {sort === "near" && !pos && (
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--ink3)", background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 13px" }}>
              위치 권한을 허용하면 가까운 순으로 정렬돼요 (지금은 추천순)
            </div>
          )}

          {rows === null && <div style={{ marginTop: 20, fontSize: 13.5, color: "var(--ink3)" }}>불러오는 중…</div>}
          {rows !== null && listed.length === 0 && (
            <div style={{ marginTop: 30, textAlign: "center", fontSize: 13.5, color: "var(--ink3)" }}>이 조건의 업체가 아직 없어요.</div>
          )}

          {listed.map((p) => {
            const s = stats[p.id] ?? { review_count: 0, avg_rating: 0 };
            const c = camps[p.id];
            const d = pos ? distM(pos.lat, pos.lng, p.lat, p.lng) : null;
            return (
              <Link
                key={p.id}
                href={"/place?id=" + p.id}
                style={{ display: "flex", gap: 12, alignItems: "center", background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "12px 14px", marginTop: 10 }}
              >
                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 13,
                    backgroundColor: "var(--chip)",
                    backgroundImage: p.image_url ? "url(" + p.image_url + ")" : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--brand-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.category}
                    {p.subcategory ? " · " + p.subcategory : ""}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: 12, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <b style={{ color: "#F59E0B" }}>★ {Number(s.avg_rating).toFixed(1)}</b>
                    <span style={{ color: "var(--ink3)" }}> ({s.review_count}) · {p.area}</span>
                  </div>
                  {c && (
                    <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 900, background: "var(--brand-bg)", color: "var(--brand-dark)", borderRadius: 6, padding: "2px 7px" }}>
                        모집 {c.n}
                      </span>
                      {c.today && (
                        <span style={{ fontSize: 10, fontWeight: 900, background: "#E8F7EF", color: "#1FA45B", borderRadius: 6, padding: "2px 7px" }}>오늘 가능</span>
                      )}
                      {c.chs.slice(0, 3).map((ch) => (
                        <span key={ch} style={{ fontSize: 10, fontWeight: 800, background: "var(--chip)", color: "var(--ink2)", borderRadius: 6, padding: "2px 7px" }}>
                          {ch}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {d !== null && <div style={{ fontSize: 13, fontWeight: 900, color: "var(--brand-dark)" }}>{fmtDist(d)}</div>}
                  <span style={{ color: "var(--ink3)" }}>›</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {noGeo && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 12,
            right: 12,
            zIndex: 500,
            background: "rgba(20,15,10,.85)",
            color: "#fff",
            borderRadius: 12,
            padding: "11px 14px",
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
          }}
          onClick={() => setNoGeo(false)}
        >
          위치 권한을 허용하면 내 주변 업체와 거리를 볼 수 있어요 (브라우저 설정 → 위치 허용)
        </div>
      )}
    </div>
  );
}
