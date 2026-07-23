"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";

const ADMIN_EMAIL = "admin@jmgroup.kr";

type Topup = { id: string; user_id: string; amount: number; depositor: string; bank_type: string; status: string; created_at: string; paid_at: string | null };

export default function AdminTopupsPage() {
  const supabase = getSupabase();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Topup[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from("topups").select("*").order("created_at", { ascending: false });
    setRows((data as Topup[]) ?? []);
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

  async function confirm(id: string) {
    if (!supabase) return;
    setBusy(id);
    const { error } = await supabase.rpc("confirm_topup", { p_id: id });
    setBusy(null);
    if (error) setMsg("처리 실패: " + error.message);
    else load();
  }

  async function reject(id: string) {
    if (!supabase) return;
    setBusy(id);
    const { error } = await supabase.rpc("reject_topup", { p_id: id });
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

  const card = (t: Topup) => (
    <div key={t.id} style={{ border: "1px solid var(--line)", borderRadius: 16, marginTop: 12, padding: "15px 18px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <b style={{ fontSize: 15 }}>{t.depositor}</b>
        <span style={{ marginLeft: 10, fontSize: 12, color: "var(--ink3)" }}>
          {t.bank_type === "KR" ? "한국 계좌" : "베트남 계좌"} · {new Date(t.created_at).toLocaleString("ko-KR")}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11.5,
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: 8,
            background: t.status === "pending" ? "#FFF4E0" : t.status === "paid" ? "#E8F7EF" : "#F5F2ED",
            color: t.status === "pending" ? "#8A6D1A" : t.status === "paid" ? "#1FA45B" : "#9B948B",
          }}
        >
          {t.status === "pending" ? "확인 대기" : t.status === "paid" ? "충전 완료" : "거절"}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 15, fontWeight: 900, color: "var(--brand-dark)" }}>{t.amount.toLocaleString()}원</div>
      {t.status === "pending" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn pri" style={{ padding: "10px 18px", fontSize: 13 }} onClick={() => confirm(t.id)} disabled={busy === t.id}>
            입금 확인 — 충전하기
          </button>
          <button
            className="btn ghost"
            style={{ padding: "10px 14px", fontSize: 13, color: "#C0392B" }}
            onClick={() => {
              if (window.confirm(t.depositor + "님의 충전 신청을 거절할까요?")) reject(t.id);
            }}
            disabled={busy === t.id}
          >
            거절
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
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 10 }}>충전 관리</h1>
      <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
        통장에서 입금자명·금액 확인 후 "입금 확인"을 누르면 사장님 크레딧이 충전돼요.
      </div>

      {msg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#C0392B" }}>{msg}</div>}

      <h2 style={{ fontSize: 16, fontWeight: 900, marginTop: 22 }}>확인 대기 {pending.length}건</h2>
      {pending.length === 0 && <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--ink3)" }}>대기 중인 충전 신청이 없어요.</div>}
      {pending.map(card)}

      {done.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 900, marginTop: 30 }}>처리 완료</h2>
          {done.map(card)}
        </>
      )}
    </div>
  );
}
