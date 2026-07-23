"use client";

import { useEffect, useRef } from "react";
import { loadLeaflet, DANANG } from "../lib/leaflet";

export default function MapPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let dead = false;
    loadLeaflet().then((L) => {
      if (dead || !ref.current || mapRef.current) return;
      const center = lat != null && lng != null ? [lat, lng] : DANANG;
      const map = L.map(ref.current).setView(center, lat != null ? 15 : 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
      if (lat != null && lng != null) {
        markerRef.current = L.circleMarker([lat, lng], { radius: 10, color: "#F04E1A", fillColor: "#FF7A45", fillOpacity: 0.95, weight: 2.5 }).addTo(map);
      }
      map.on("click", (e: any) => {
        const { lat: la, lng: ln } = e.latlng;
        if (markerRef.current) markerRef.current.setLatLng([la, ln]);
        else markerRef.current = L.circleMarker([la, ln], { radius: 10, color: "#F04E1A", fillColor: "#FF7A45", fillOpacity: 0.95, weight: 2.5 }).addTo(map);
        onPick(la, ln);
      });
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

  return <div ref={ref} style={{ height: 230, borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--line)", zIndex: 0 }} />;
}
