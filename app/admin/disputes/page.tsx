"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";

const ADMIN_EMAIL = "admin@jmgroup.kr";

type Row = {
  id: string;
  user_id: string;
  status: string;
  review_url: string | null;
  review_submitted_at: string | null;
  dispute_status: string | null;
  dispute_reason: string | null;
  disputed_at: string | null;
  campaigns: { store_name: string; reward_points: number | null; owner_id: string } | null;
  nickname?: string;
};

export default function AdminDisputesPage() {
  const supabase = getSupabase();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    if (!supabase) return;
    const { data } = await supabase
      .from("applications")
      .select("id, user_id, status, review_url, review_submitted_at, dispute_status, dispute_reason, disputed_at, campaigns(store_name, reward_points, owner_id)")
      .in("dispute_status", ["issue", "dispute", "resolved_pay", "resolved_deny"])
      .order("disputed_at", { ascending: false });
    let rs = (data as unknown as Row[]) ?? [];
    if (rs.length) {
      const ids = Array.from(new Set(rs.map((r) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id, nickname").in("id", ids);
      const nm: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => (nm[p.id] = p.nickname));
      rs = rs.map((r) => ({ ...r, nickname: nm[r.user_id] ?? "리뷰어" }));
    }
    setRows(rs);
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

  async function resolve(id: string, pay: boolean) {
    if (!supabase) return;
    if (!confirm(pay ? "리뷰어에게 지급 확정할까요? (사장님 크레딧에서 차감)" : "지급 없이 종료할까요? (리뷰어에게 지급 안 됨)")) return;
    setBusy(id);
    const { error } = await supabase.rpc("resolve_dispute", { p_app_id: id, p_pay: pay });
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

  const active = rows.filter((r) => r.dispute_status === "dispute");
  const issues = rows.filter((r) => r.dispute_status === "issue");
  const closed = rows.filter((r) => r.dispute_status?.startsWith("resolved"));

  const card = (r: Row, actionable: boolean) => (
    <div key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 16, marginTop: 12, padding: "15px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <b style={{ fontSize: 14.5 }}>{r.campaigns?.store_name}</b>
        <span style={{ fontSize: 12, color: "var(--ink3)" }}>리뷰어: {r.nickname}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: r.dispute_status === "dispute" ? "#C0392B" : r.dispute_status === "issue" ? "#8A6D1A" : "var(--ink3)" }}>
          {r.dispute_status === "dispute" ? "분쟁 (중재 필요)" : r.dispute_status === "issue" ? "문제제기 (협의 중)" : r.dispute_status === "resolved_pay" ? "종결 — 지급" : "종결 — 미지급"}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "var(--ink2)" }}>
        사유: {r.dispute_reason ?? "-"}
        <br />
        보상: {(r.campaigns?.reward_points ?? 0).toLocaleString()}P ·{" "}
        {r.review_url && (
          <a href={r.review_url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", fontWeight: 800 }}>
            제출된 리뷰 보기
          </a>
        )}
      </div>
      {actionable && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn pri" style={{ padding: "10px 16px", fontSize: 13 }} onClick={() => resolve(r.id, true)} disabled={busy === r.id}>
            리뷰어 지급 확정
          </button>
          <button className="btn ghost" style={{ padding: "10px 14px", fontSize: 13, color: "#C0392B" }} onClick={() => resolve(r.id, false)} disabled={busy === r.id}>
            지급 없이 종료
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
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 10 }}>분쟁 중재</h1>
      <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
        리뷰와 문제제기 사유를 보고 지급 여부를 결정하세요. 필요하면 양쪽에 카톡으로 연락 후 처리!
      </div>

      {msg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#C0392B" }}>{msg}</div>}

      <h2 style={{ fontSize: 16, fontWeight: 900, marginTop: 22 }}>중재 필요 {active.length}건</h2>
      {active.length === 0 && <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--ink3)" }}>중재할 분쟁이 없어요.</div>}
      {active.map((r) => card(r, true))}

      {issues.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 900, marginTop: 28 }}>문제제기 — 당사자 협의 중 {issues.length}건</h2>
          <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 4 }}>아직 분쟁으로 넘어오지 않은 건이에요. 지켜보다가 필요하면 개입하세요.</div>
          {issues.map((r) => card(r, true))}
        </>
      )}

      {closed.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 900, marginTop: 28 }}>종결</h2>
          {closed.map((r) => card(r, false))}
        </>
      )}
    </div>
  );
}
