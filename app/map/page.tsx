"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import { loadLeaflet, DANANG } from "../../lib/leaflet";

type P = { id: string; name: string; category: string; subcategory: string; area: string; lat: number; lng: number };
type Stat = { place_id: string; review_count: number; avg_rating: number };

function inVietnam(lat: number, lng: number) {
  return lat > 8 && lat < 24 && lng > 101.5 && lng < 110.5;
}

export default function MapPage() {
  const supabase = getSupabase();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const meRef = useRef<any>(null);
  const [count, setCount] = useState<number | null>(null);
  const [noGeo, setNoGeo] = useState(false);

  function locate(fly: boolean) {
    if (!navigator.geolocation) {
      setNoGeo(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: la, longitude: ln } = pos.coords;
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

      // GPS 권한 요청 (실제 위치 표시)
      locate(false);

      if (!supabase) {
        setCount(0);
        return;
      }
      const [{ data: pl }, { data: st }] = await Promise.all([
        supabase.from("places").select("id, name, category, subcategory, area, lat, lng").not("lat", "is", null),
        supabase.from("place_stats").select("*"),
      ]);
      const stats: Record<string, Stat> = {};
      ((st as Stat[]) ?? []).forEach((x) => (stats[x.place_id] = x));
      const rows = (pl as P[]) ?? [];
      setCount(rows.length);
      rows.forEach((p) => {
        const s = stats[p.id] ?? { review_count: 0, avg_rating: 0 };
        const html =
          '<div style="font-family:inherit;min-width:150px">' +
          '<b style="font-size:14px">' + p.name + "</b><br/>" +
          '<span style="font-size:11.5px;color:#777">' + p.category + (p.subcategory ? " · " + p.subcategory : "") + "</span><br/>" +
          '<span style="font-size:12px;color:#F59E0B;font-weight:800">★ ' + Number(s.avg_rating).toFixed(1) + "</span>" +
          '<span style="font-size:11px;color:#999"> (' + s.review_count + ")</span><br/>" +
          '<a href="/place?id=' + p.id + '" style="font-size:12.5px;font-weight:800;color:#D9420F">자세히 보기 →</a></div>';
        L.circleMarker([p.lat, p.lng], { radius: 10, color: "#fff", fillColor: "#F04E1A", fillOpacity: 0.95, weight: 2.5 })
          .addTo(map)
          .bindPopup(html);
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

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 500,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", fontSize: 14, fontWeight: 900, boxShadow: "0 2px 12px rgba(0,0,0,.12)" }}>
          주변 체험 지도
          {count !== null && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink3)", marginLeft: 7 }}>업체 {count}곳</span>}
        </div>
        <Link
          href="/places"
          style={{ marginLeft: "auto", background: "#fff", borderRadius: 12, padding: "10px 14px", fontSize: 12.5, fontWeight: 800, boxShadow: "0 2px 12px rgba(0,0,0,.12)" }}
        >
          목록으로 ≡
        </Link>
      </div>

      <div ref={ref} style={{ height: "calc(100dvh - 132px)", minHeight: 420, zIndex: 0 }} />

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
          위치 권한을 허용하면 내 주변 업체를 볼 수 있어요 (브라우저 설정 → 위치 허용)
        </div>
      )}
    </div>
  );
}
