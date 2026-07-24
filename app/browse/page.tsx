"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import CampaignGrid from "../../components/CampaignGrid";

export default function BrowsePage() {
  const supabase = getSupabase();
  const [ready, setReady] = useState(false);
  const [t, setT] = useState<"" | "체험단" | "기자단">("");
  const [cat, setCat] = useState("전체");
  const [list, setList] = useState<any[] | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const pt = sp.get("t");
    if (pt === "체험단" || pt === "기자단") setT(pt);
    const pc = sp.get("cat");
    if (pc) setCat(pc);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setList([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id, store_name, category, offer, mission_type, quota, applied, area, image_url, reward_points, party_size, created_at, today_available, camp_type")
        .eq("status", "active")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      setList(data ?? []);
    })();
  }, [supabase]);

  const title = t === "기자단" ? "기자단 캠페인" : t === "체험단" ? "체험단 캠페인" : cat !== "전체" ? cat + " 캠페인" : "전체 캠페인";

  return (
    <div className="wrap" style={{ maxWidth: 1120, paddingTop: 22, paddingBottom: 90 }}>
      <Link href="/" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 홈으로
      </Link>
      <h1 style={{ fontSize: 21, fontWeight: 900, marginTop: 12 }}>{title}</h1>
      <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2, marginBottom: 4 }}>
        {list === null ? "불러오는 중…" : `모집 중 ${list.length}개 · 조건을 눌러 좁혀보세요`}
      </div>
      {ready && list !== null && (
        <CampaignGrid list={list} showRegions initialCampType={t} initialCat={cat} />
      )}
    </div>
  );
}
