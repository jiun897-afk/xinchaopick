"use client";

import { useState } from "react";
import { getSupabase } from "../lib/supabase";

/* 당일 방문 신청 (사장님 수락형) */
export default function TodayVisitButton({ campaignId, busyDate }: { campaignId: string; busyDate: string | null }) {
  const supabase = getSupabase();
  const [st, setSt] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");

  const n = new Date();
  const todayIso = n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0");
  const shopBusy = busyDate === todayIso;

  if (shopBusy)
    return (
      <div style={{ marginTop: 12, background: "var(--chip)", borderRadius: 14, padding: "13px 16px", fontSize: 13, fontWeight: 800, color: "var(--ink3)", textAlign: "center" }}>
        😢 오늘은 업체가 바빠서 당일 방문이 어려워요 — 내일 다시 확인해주세요
      </div>
    );

  if (st === "done")
    return (
      <div style={{ marginTop: 12, background: "#E8F7EF", borderRadius: 14, padding: "14px 16px", fontSize: 13, fontWeight: 800, color: "#1FA45B", lineHeight: 1.6 }}>
        ⚡ 오늘 방문 신청 완료! 사장님이 수락하면 바로 알림을 보내드려요.
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink3)", marginTop: 3 }}>
          1시간 안에 응답이 없으면 자동 취소돼요. 수락 알림을 받은 뒤 방문해주세요!
        </div>
      </div>
    );

  async function go() {
    if (!supabase) {
      window.location.href = "/login";
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setSt("busy");
    setErr("");
    const { error } = await supabase.rpc("request_today_visit", { p_campaign_id: campaignId });
    if (error) {
      setErr(error.message);
      setSt("idle");
    } else setSt("done");
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        className="btn"
        onClick={go}
        disabled={st === "busy"}
        style={{
          width: "100%",
          padding: "14px 0",
          fontSize: 15,
          borderRadius: 14,
          background: "linear-gradient(135deg, #FFB347, #F55B24)",
          color: "#fff",
          boxShadow: "0 4px 14px rgba(240,78,26,.3)",
        }}
      >
        {st === "busy" ? "신청 중…" : "⚡ 오늘 갈게요 — 당일 방문 신청"}
      </button>
      <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 6, textAlign: "center", fontWeight: 700 }}>
        사장님이 수락하면 알림이 와요 · 1시간 무응답 시 자동 취소
      </div>
      {err && <div className="notice err" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  );
}
