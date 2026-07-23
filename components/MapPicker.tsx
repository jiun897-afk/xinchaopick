"use client";

import { useEffect, useRef } from "react";
import { loadLeaflet, DANANG } from "../lib/leaflet";

/* 표시 전용 지도: 핀은 주소 검색으로만 찍히고, 사용자는 확대·이동으로 확인만 가능 */
export default function MapPicker({ lat, lng }: { lat: number | null; lng: number | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let dead = false;
    loadLeaflet().then((L) => {
      if (dead || !ref.current || mapRef.current) return;
      const center = lat != null && lng != null ? [lat, lng] : DANANG;
      const map = L.map(ref.current).setView(center, lat != null ? 16 : 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
      if (lat != null && lng != null) {
        markerRef.current = L.circleMarker([lat, lng], { radius: 10, color: "#fff", fillColor: "#F04E1A", fillOpacity: 0.95, weight: 2.5 }).addTo(map);
      }
      mapRef.current = map;
    });
    return () => {
      dead = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map || lat == null || lng == null) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else markerRef.current = L.circleMarker([lat, lng], { radius: 10, color: "#fff", fillColor: "#F04E1A", fillOpacity: 0.95, weight: 2.5 }).addTo(map);
    map.setView([lat, lng], 16);
  }, [lat, lng]);

  return <div ref={ref} style={{ height: 230, borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--line)", zIndex: 0 }} />;
}
