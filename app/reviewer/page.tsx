"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

type Prof = { id: string; nickname: string; blog_grade: string | null; blog_verified: boolean };
type Rev = { id: string; rating: number; content: string; verified: boolean; created_at: string; places: { id: string; name: string } | null };

const GRADE_COLOR: Record<string, { c: string; bg: string }> = {
  "파워": { c: "#F04E1A", bg: "#FFF0E8" },
  "인기": { c: "#1A56DB", bg: "#E8F0FE" },
  "성장": { c: "#1FA45B", bg: "#E8F7EF" },
  "새싹": { c: "#8A6D1A", bg: "#FFF4E0" },
};

export default function ReviewerPage() {
  const supabase = getSupabase();
  const [prof, setProf] = useState<Prof | null>(null);
  const [revs, setRevs] = useState<Rev[] | null>(null);

  useEffect(() => {
    const uid = new URLSearchParams(window.location.search).get("id");
    if (!uid || !supabase) return;
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("id, nickname, blog_grade, blog_verified").eq("id", uid).maybeSingle(),
        supabase
          .from("place_reviews")
          .select("id, rating, content, verified, created_at, places(id, name)")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      setProf((p as Prof) ?? null);
      setRevs((r as unknown as Rev[]) ?? []);
    })();
  }, [supabase]);

  if (!prof || revs === null)
    return <div className="wrap" style={{ paddingTop: 40, color: "var(--ink3)" }}>불러오는 중…</div>;

  const avg = revs.length ? revs.reduce((a, r) => a + r.rating, 0) / revs.length : 0;
  const verifiedCount = revs.filter((r) => r.verified).length;
  const gc = prof.blog_grade ? GRADE_COLOR[prof.blog_grade] ?? GRADE_COLOR["새싹"] : null;

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/places" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 업체 목록
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, border: "1px solid var(--line)", borderRadius: 18, padding: "18px 18px" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--brand)", color: "#fff", fontWeight: 900, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {prof.nickname[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16.5, fontWeight: 900 }}>
            {prof.nickname}
            {prof.blog_grade && gc && (
              <span style={{ marginLeft: 7, fontSize: 11, fontWeight: 900, background: gc.bg, color: gc.c, borderRadius: 7, padding: "3px 8px" }}>
                {prof.blog_grade}
                {prof.blog_verified ? "✓" : ""}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 3 }}>
            후기 {revs.length}개 · <b style={{ color: "#F59E0B" }}>★ {avg ? avg.toFixed(1) : "-"}</b>
            {verifiedCount > 0 ? ` · 체험단 인증 후기 ${verifiedCount}개` : ""}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 16.5, fontWeight: 900, marginTop: 24 }}>남긴 후기</h2>
      {revs.length === 0 && <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink3)" }}>아직 남긴 후기가 없어요.</div>}
      {revs.map((r) => (
        <div key={r.id} style={{ borderBottom: "1px solid var(--line)", padding: "14px 2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {r.places && (
              <Link href={"/place?id=" + r.places.id} style={{ fontSize: 13.5, fontWeight: 800, textDecoration: "underline" }}>
                {r.places.name}
              </Link>
            )}
            {r.verified && (
              <span style={{ fontSize: 10, fontWeight: 900, background: "var(--brand-bg)", color: "var(--brand-dark)", borderRadius: 6, padding: "2px 7px" }}>체험단 인증</span>
            )}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink3)" }}>{new Date(r.created_at).toLocaleDateString("ko-KR")}</span>
          </div>
          <div style={{ marginTop: 4, color: "#F59E0B", fontSize: 13, fontWeight: 800 }}>{"★".repeat(r.rating)}</div>
          {r.content && <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 5, lineHeight: 1.65 }}>{r.content}</p>}
        </div>
      ))}
    </div>
  );
}
