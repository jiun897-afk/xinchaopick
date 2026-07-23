"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";

const ADMIN_EMAIL = "admin@jmgroup.kr";

type Report = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  place_reviews: { id: string; rating: number; content: string; verified: boolean; place_id: string } | null;
};

export default function AdminReportsPage() {
  const supabase = getSupabase();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Report[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    if (!supabase) return;
    const { data } = await supabase
      .from("review_reports")
      .select("id, reason, status, created_at, place_reviews(id, rating, content, verified, place_id)")
      .order("created_at", { ascending: false });
    setRows((data as unknown as Report[]) ?? []);
  }

  useEffect(() => {
    if (!supabase) {
      setAllowed(false);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ok = session?.user?.email === ADMIN_EMAIL;
      setAllowed(ok);
      if (ok) load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function resolve(id: string, del: boolean) {
    if (!supabase) return;
    if (del && !confirm("신고된 후기를 삭제할까요? 되돌릴 수 없어요.")) return;
    setBusy(id);
    const { error } = await supabase.rpc("resolve_report", { p_id: id, p_delete: del });
    setBusy(null);
    if (error) setMsg("처리 실패: " + error.message);
    else load();
  }

  if (allowed === null) return <div className="wrap" style={{ paddingTop: 40, color: "var(--ink3)" }}>확인 중…</div>;
  if (!allowed)
    return (
      <div className="wrap" style={{ maxWidth: 560, paddingTop: 40 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900 }}>운영자 전용 페이지예요</h1>
        <Link className="btn pri" style={{ marginTop: 16, padding: "12px 22px" }} href="/login">
          로그인하기
        </Link>
      </div>
    );

  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending");

  const card = (r: Report, actionable: boolean) => (
    <div key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 16, marginTop: 12, padding: "15px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <b style={{ fontSize: 13.5, color: "#C0392B" }}>신고 사유: {r.reason}</b>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink3)" }}>{new Date(r.created_at).toLocaleDateString("ko-KR")}</span>
      </div>
      {r.place_reviews ? (
        <div style={{ marginTop: 8, background: "var(--chip)", borderRadius: 10, padding: "10px 13px", fontSize: 13, lineHeight: 1.6 }}>
          <span style={{ color: "#F59E0B", fontWeight: 800 }}>{"★".repeat(r.place_reviews.rating)}</span>{" "}
          {r.place_reviews.content}
          <Link href={"/place?id=" + r.place_reviews.place_id} style={{ marginLeft: 8, fontSize: 11.5, textDecoration: "underline", color: "var(--brand-dark)" }}>
            업체 보기
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--ink3)" }}>(이미 삭제된 후기)</div>
      )}
      {actionable && r.place_reviews && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn pri" style={{ padding: "10px 16px", fontSize: 13, background: "#C0392B" }} onClick={() => resolve(r.id, true)} disabled={busy === r.id}>
            후기 삭제
          </button>
          <button className="btn ghost" style={{ padding: "10px 14px", fontSize: 13 }} onClick={() => resolve(r.id, false)} disabled={busy === r.id}>
            문제없음 (기각)
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="wrap" style={{ maxWidth: 680, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/me" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 마이
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 10 }}>후기 신고 관리</h1>

      {msg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#C0392B" }}>{msg}</div>}

      <h2 style={{ fontSize: 16, fontWeight: 900, marginTop: 22 }}>대기 {pending.length}건</h2>
      {pending.length === 0 && <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--ink3)" }}>대기 중인 신고가 없어요.</div>}
      {pending.map((r) => card(r, true))}

      {done.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 900, marginTop: 28 }}>처리 완료</h2>
          {done.map((r) => card(r, false))}
        </>
      )}
    </div>
  );
}
