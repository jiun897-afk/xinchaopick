"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import CampaignGrid from "../../components/CampaignGrid";
import SnsLogo from "../../components/SnsLogo";

const CH_META: Record<string, { emoji: string; title: string; missions: string[] | null }> = {
  "블로그": { emoji: "✍️", title: "블로그 체험단", missions: ["네이버 블로그"] },
  "유튜브": { emoji: "▶️", title: "유튜브 롱폼", missions: ["유튜브 롱폼", "영상"] },
  "쇼츠": { emoji: "🎬", title: "유튜브 쇼츠", missions: ["유튜브 쇼츠"] },
  "클립": { emoji: "🎞️", title: "네이버 클립", missions: ["네이버 클립"] },
  "인스타": { emoji: "📸", title: "인스타그램", missions: ["인스타그램"] },
  "릴스": { emoji: "🎥", title: "인스타 릴스", missions: ["인스타 릴스"] },
  "페북": { emoji: "👥", title: "페이스북", missions: ["페이스북"] },
  "스레드": { emoji: "🧵", title: "스레드", missions: ["스레드"] },
  "X": { emoji: "✖️", title: "X(엑스)", missions: ["X(엑스)"] },
  "기자단": { emoji: "📰", title: "기자단", missions: null },
};

export default function ChannelPage() {
  const supabase = getSupabase();
  const [ch, setCh] = useState<string | null>(null);
  const [list, setList] = useState<any[] | null>(null);

  useEffect(() => {
    setCh(new URLSearchParams(window.location.search).get("c") ?? "블로그");
  }, []);

  useEffect(() => {
    if (!ch || !supabase) return;
    const meta = CH_META[ch] ?? CH_META["블로그"];
    (async () => {
      let q = supabase
        .from("campaigns")
        .select("id, store_name, category, offer, mission_type, quota, applied, area, image_url, reward_points, party_size, created_at, today_available, camp_type")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(100);
      if (meta.missions) q = q.in("mission_type", meta.missions);
      else q = q.eq("camp_type", "기자단");
      const { data } = await q;
      setList(data ?? []);
    })();
  }, [ch, supabase]);

  const meta = ch ? CH_META[ch] ?? CH_META["블로그"] : null;

  return (
    <div className="wrap" style={{ maxWidth: 1120, paddingTop: 22, paddingBottom: 90 }}>
      <Link href="/" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 홈으로
      </Link>
      {meta && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, marginBottom: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "#fff", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SnsLogo name={ch ?? "블로그"} size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 900 }}>{meta.title}</h1>
            <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>
              {list === null ? "불러오는 중…" : `모집 중 ${list.length}개 · 지역을 골라보세요`}
            </div>
          </div>
        </div>
      )}
      {list !== null && <CampaignGrid list={list} hideChannelRow showRegions />}
    </div>
  );
}
