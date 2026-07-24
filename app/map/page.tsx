"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import { loadLeaflet, DANANG } from "../../lib/leaflet";
import { distM, fmtDist } from "../../lib/geo";
import RangeCalendar from "../../components/RangeCalendar";

type P = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  area: string;
  lat: number;
  lng: number;
  image_url: string | null;
  busy_date: string | null;
};
type Stat = { place_id: string; review_count: number; avg_rating: number };
type Camp = {
  place_id: string;
  mission_type: string;
  today_available: boolean | null;
  camp_type: string | null;
  avail_type: string | null;
  avail_dates: string[] | null;
};
type Agg = { n: number; today: boolean; chs: string[]; jj: boolean };

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
const SNS_OPTS = ["전체", "블로그", "클립", "유튜브", "쇼츠", "인스타", "릴스", "틱톡", "페북", "스레드", "X"];

function inVietnam(lat: number, lng: number) {
  return lat > 8 && lat < 24 && lng > 101.5 && lng < 110.5;
}

function availOn(c: Camp, from: string, to: string): boolean {
  if (!from) return true;
  if (c.avail_type !== "dates") return true; // 언제나 가능
  const end = to || from;
  return (c.avail_dates ?? []).some((d) => d >= from && d <= end);
}

function fmtD(s: string) {
  return Number(s.slice(5, 7)) + "/" + Number(s.slice(8, 10));
}

export default function MapPage() {
  const supabase = getSupabase();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const meRef = useRef<any>(null);
  const posRef = useRef<{ lat: number; lng: number } | null>(null);
  const markersRef = useRef<Record<string, any>>({});
  const aggRef = useRef<Record<string, Agg>>({});
  const dateRef = useRef("");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [noGeo, setNoGeo] = useState(false);
  const [farAway, setFarAway] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [rows, setRows] = useState<P[] | null>(null);
  const [stats, setStats] = useState<Record<string, Stat>>({});
  const [byPlace, setByPlace] = useState<Record<string, Camp[]>>({});
  const [sort, setSort] = useState("near");
  const [todayOnly, setTodayOnly] = useState(false);
  const [cat, setCat] = useState("전체");
  const [sns, setSns] = useState("전체");
  const [dfrom, setDfrom] = useState(""); // '' = 전체 날짜
  const [dto, setDto] = useState("");
  const [calOpen, setCalOpen] = useState(false);

  function applyPos(la: number, ln: number, fly: boolean) {
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
    setFarAway(!inVietnam(la, ln));
    try {
      localStorage.setItem("vj_lastpos", JSON.stringify({ lat: la, lng: ln }));
    } catch {}
  }

  function locate(fly: boolean) {
    if (!navigator.geolocation) {
      setNoGeo(true);
      return;
    }
    let got = false;
    // 1단계: 기지국/와이파이 기반 — 캐시 허용, 즉시 표시
    navigator.geolocation.getCurrentPosition(
      (p) => {
        got = true;
        applyPos(p.coords.latitude, p.coords.longitude, fly);
      },
      () => {
        if (!got) setNoGeo(true);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 120000 }
    );
    // 2단계: 정밀 GPS — 잡히는 대로 조용히 보정 (지도 이동은 안 함)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const first = !got;
        got = true;
        applyPos(p.coords.latitude, p.coords.longitude, first && fly);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  useEffect(() => {
    let dead = false;
    loadLeaflet().then(async (L) => {
      if (dead || !ref.current || mapRef.current) return;
      // 마지막 위치 기억: 다낭 거쳐가는 점프 방지
      let init: [number, number] = DANANG as any;
      let initZoom = 13;
      try {
        const saved = localStorage.getItem("vj_lastpos");
        if (saved) {
          const p0 = JSON.parse(saved);
          if (p0 && typeof p0.lat === "number") {
            init = [p0.lat, p0.lng];
            initZoom = 14;
          }
        }
      } catch {}
      const map = L.map(ref.current, { zoomControl: false }).setView(init, initZoom);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      mapRef.current = map;
      locate(true); // 첫 진입: GPS 잡히면 내 위치로 이동 (베트남 밖이어도)

      if (!supabase) {
        setRows([]);
        return;
      }
      const [{ data: pl }, { data: st }, { data: cp }] = await Promise.all([
        supabase.from("places").select("id, name, category, subcategory, area, lat, lng, image_url, busy_date").not("lat", "is", null),
        supabase.from("place_stats").select("*"),
        supabase
          .from("campaigns")
          .select("place_id, mission_type, today_available, camp_type, avail_type, avail_dates")
          .eq("status", "active")
          .not("place_id", "is", null),
      ]);
      const sm: Record<string, Stat> = {};
      ((st as Stat[]) ?? []).forEach((x) => (sm[x.place_id] = x));
      setStats(sm);
      const bp: Record<string, Camp[]> = {};
      // 기자단은 방문 없는 원고형이라 지도에서 제외
      ((cp as Camp[]) ?? []).filter((c) => c.camp_type !== "기자단").forEach((c) => {
        (bp[c.place_id] = bp[c.place_id] ?? []).push(c);
      });
      setByPlace(bp);
      const list = (pl as P[]) ?? [];
      setRows(list);
      list.forEach((p) => {
        const s = sm[p.id] ?? { review_count: 0, avg_rating: 0 };
        const mk = L.circleMarker([p.lat, p.lng], { radius: 10, color: "#fff", fillColor: "#F04E1A", fillOpacity: 0.95, weight: 2.5 })
          .addTo(map)
          .bindPopup(() => {
            const my = posRef.current;
            const d = my ? distM(my.lat, my.lng, p.lat, p.lng) : null;
            const a = aggRef.current[p.id];
            const dsel = dateRef.current;
            return (
              '<div style="font-family:inherit;min-width:150px">' +
              '<b style="font-size:14px">' + p.name + "</b><br/>" +
              '<span style="font-size:11.5px;color:#777">' + p.category + (p.subcategory ? " · " + p.subcategory : "") + "</span><br/>" +
              '<span style="font-size:12px;color:#F59E0B;font-weight:800">★ ' + Number(s.avg_rating).toFixed(1) + "</span>" +
              '<span style="font-size:11px;color:#999"> (' + s.review_count + ")</span>" +
              (d !== null ? '<span style="font-size:11.5px;color:#D9420F;font-weight:800"> · 내 위치에서 ' + fmtDist(d) + "</span>" : "") +
              "<br/>" +
              (a
                ? '<span style="font-size:11px;color:#1FA45B;font-weight:800">' +
                  (dsel ? "선택 날짜 체험 가능 · " : "") + "체험단 " + a.n + "개 모집중" + (a.today ? " · 오늘 가능" : "") +
                  "</span><br/>"
                : "") +
              '<a href="/place?id=' + p.id + '" style="font-size:12.5px;font-weight:800;color:#D9420F">자세히 보기 →</a></div>'
            );
          });
        markersRef.current[p.id] = mk;
      });
    });
    return () => {
      dead = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        meRef.current = null;
        markersRef.current = {};
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const agg = useMemo(() => {
    const m: Record<string, Agg> = {};
    const n0 = new Date();
    const tIso = n0.getFullYear() + "-" + String(n0.getMonth() + 1).padStart(2, "0") + "-" + String(n0.getDate()).padStart(2, "0");
    const busySet = new Set((rows ?? []).filter((p) => p.busy_date === tIso).map((p) => p.id));
    Object.entries(byPlace).forEach(([pid, cs]) => {
      const av = cs.filter((c) => availOn(c, dfrom, dto));
      if (!av.length) return;
      const e: Agg = { n: av.length, today: av.some((c) => !!c.today_available) && !busySet.has(pid), chs: [], jj: av.some((c) => c.camp_type === "기자단") };
      av.forEach((c) => {
        const s = CH_SHORT[c.mission_type] ?? c.mission_type;
        if (!e.chs.includes(s)) e.chs.push(s);
      });
      m[pid] = e;
    });
    return m;
  }, [byPlace, rows, dfrom, dto]);

  useEffect(() => {
    aggRef.current = agg;
    dateRef.current = dfrom;
    // 날짜 선택 시 해당 기간 가능 업체만 지도에 표시
    const map = mapRef.current;
    if (!map) return;
    Object.entries(markersRef.current).forEach(([pid, mk]) => {
      const show = (dfrom === "" || !!agg[pid]) && (!todayOnly || !!agg[pid]?.today);
      if (show && !map.hasLayer(mk)) mk.addTo(map);
      else if (!show && map.hasLayer(mk)) map.removeLayer(mk);
    });
  }, [agg, dfrom, dto, todayOnly]);

  const cats = useMemo(() => {
    const s = new Set<string>();
    (rows ?? []).forEach((p) => s.add(p.category));
    return ["전체", ...Array.from(s)];
  }, [rows]);

  const listed = useMemo(() => {
    let r = rows ?? [];
    if (dfrom !== "") r = r.filter((p) => agg[p.id]);
    if (todayOnly) r = r.filter((p) => agg[p.id]?.today);
    if (cat !== "전체") r = r.filter((p) => p.category === cat);
    if (sns !== "전체") {
      r = r.filter((p) => {
        const c = agg[p.id];
        return !!c && c.chs.includes(sns);
      });
    }
    const st = (id: string) => stats[id] ?? { review_count: 0, avg_rating: 0 };
    const dist = (p: P) => (pos ? distM(pos.lat, pos.lng, p.lat, p.lng) : Infinity);
    const reco = (p: P) => Number(st(p.id).avg_rating) + Math.log10(st(p.id).review_count + 1);
    if (sort === "near" && pos) r = [...r].sort((a, b) => dist(a) - dist(b));
    else r = [...r].sort((a, b) => reco(b) - reco(a));
    return r;
  }, [rows, agg, dfrom, todayOnly, cat, sns, sort, pos, stats]);

  const chip = (on: boolean, brand = false): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 800,
    padding: "7px 13px",
    borderRadius: 999,
    cursor: "pointer",
    flexShrink: 0,
    background: on ? (brand ? "var(--brand)" : "var(--ink)") : "#fff",
    color: on ? "#fff" : "var(--ink2)",
    border: on ? "1px solid transparent" : "1px solid var(--line)",
    boxShadow: "0 1px 6px rgba(0,0,0,.06)",
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

  const todayIso = (() => {
    const n = new Date();
    return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0");
  })();
  const tomorrowIso = (() => {
    const n = new Date();
    const t = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
    return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
  })();

  const dateLabel = dfrom ? (dto && dto !== dfrom ? fmtD(dfrom) + " ~ " + fmtD(dto) : dfrom === todayIso ? "오늘" : dfrom === tomorrowIso ? "내일" : fmtD(dfrom)) : "날짜 전체";

  const dateChips = (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <span style={chip(!!dfrom, true)} onClick={() => setCalOpen((v) => !v)}>
          📅 {dateLabel} ▾
        </span>
        {dfrom && (
          <span style={chip(false)} onClick={() => { setDfrom(""); setDto(""); setCalOpen(false); }}>
            ✕ 해제
          </span>
        )}
        <span
          onClick={() => setTodayOnly((v) => !v)}
          style={{
            ...chip(false),
            background: todayOnly ? "#1FA45B" : "#fff",
            color: todayOnly ? "#fff" : "var(--ink2)",
            border: todayOnly ? "1px solid transparent" : "1px solid var(--line)",
          }}
        >
          ⚡ 오늘 가능{todayOnly ? " ✓" : ""}
        </span>
      </div>
      {calOpen && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 0,
            width: 300,
            maxWidth: "calc(100vw - 24px)",
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 18,
            boxShadow: "0 14px 40px rgba(20,15,10,.18)",
            padding: "14px 14px 12px",
            zIndex: 700,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink3)", marginBottom: 8 }}>
            날짜 하나 또는 시작·끝 두 번 눌러 기간 선택
          </div>
          <RangeCalendar
            from={dfrom}
            to={dto}
            onChange={(f, t) => {
              setDfrom(f);
              setDto(t);
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <span style={chip(dfrom === todayIso && !dto, true)} onClick={() => { setDfrom(todayIso); setDto(""); }}>
              오늘
            </span>
            <span style={chip(dfrom === tomorrowIso && !dto, true)} onClick={() => { setDfrom(tomorrowIso); setDto(""); }}>
              내일
            </span>
            <span
              style={{ ...chip(true, true), marginLeft: "auto", background: "var(--ink)", border: "1px solid var(--ink)" }}
              onClick={() => setCalOpen(false)}
            >
              완료
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 500, display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", fontSize: 14, fontWeight: 900, boxShadow: "0 2px 12px rgba(0,0,0,.12)" }}>
          주변 체험 지도
          {rows !== null && (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink3)", marginLeft: 7 }}>
              업체 {dfrom === "" ? rows.length : listed.length}곳
            </span>
          )}
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

      {view === "map" && (
        <div style={{ position: "absolute", top: 58, left: 12, right: 12, zIndex: 500 }}>{dateChips}</div>
      )}

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
          {dateChips}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, marginTop: 8 }} className="regionrow">
            <span style={chip(sort === "near")} onClick={() => { setSort("near"); if (!pos) locate(false); }}>
              📍 가까운순
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
            <div style={{ marginTop: 30, textAlign: "center", fontSize: 13.5, color: "var(--ink3)" }}>
              {dfrom ? "이 날짜에 가능한 업체가 아직 없어요." : "이 조건의 업체가 아직 없어요."}
            </div>
          )}

          {listed.map((p) => {
            const s = stats[p.id] ?? { review_count: 0, avg_rating: 0 };
            const c = agg[p.id];
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

      {farAway && view === "map" && (
        <div
          onClick={() => {
            const map = mapRef.current;
            if (map) map.setView(DANANG, 13);
            setFarAway(false);
          }}
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 500,
            background: "var(--brand)",
            color: "#fff",
            borderRadius: 999,
            padding: "11px 18px",
            fontSize: 12.5,
            fontWeight: 800,
            boxShadow: "0 4px 14px rgba(240,78,26,.4)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          지금 베트남 밖이시네요 · 다낭 업체 보기 →
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
