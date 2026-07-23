"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";

const ADMIN_EMAIL = "admin@jmgroup.kr";

type Wd = {
  id: string;
  user_id: string;
  amount: number;
  name: string;
  bank: string;
  account: string;
  status: string;
  created_at: string;
  paid_at: string | null;
};

export default function AdminWithdrawalsPage() {
  const supabase = getSupabase();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Wd[]>([]);
  const [rrns, setRrns] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
    setRows((data as Wd[]) ?? []);
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

  async function showRrn(id: string) {
    if (!supabase) return;
    setBusy(id + "rrn");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/rrn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, token: session?.access_token }),
    });
    const body = await res.json();
    setBusy(null);
    if (res.ok) setRrns((m) => ({ ...m, [id]: body.rrn }));
    else setMsg(body.error ?? "조회 실패");
  }

  async function markPaid(id: string) {
    if (!supabase) return;
    setBusy(id);
    const { error } = await supabase.from("withdrawals").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    setBusy(null);
    if (error) setMsg("처리 실패: " + error.message);
    else load();
  }

  async function reject(id: string) {
    if (!supabase) return;
    setBusy(id);
    const { error } = await supabase.rpc("reject_withdrawal", { p_id: id });
    setBusy(null);
    if (error) setMsg("거절 실패: " + error.message);
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

  const card = (w: Wd) => {
    const tax = w.amount - Math.floor(w.amount * 0.967);
    const pay = Math.floor(w.amount * 0.967);
    return (
      <div key={w.id} style={{ border: "1px solid var(--line)", borderRadius: 16, marginTop: 12, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <b style={{ fontSize: 15.5 }}>{w.name}</b>
          <span style={{ marginLeft: 10, fontSize: 12.5, color: "var(--ink3)" }}>
            {new Date(w.created_at).toLocaleDateString("ko-KR")} 신청
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11.5,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 8,
              background: w.status === "pending" ? "#FFF4E0" : w.status === "paid" ? "#E8F7EF" : "#F5F2ED",
              color: w.status === "pending" ? "#8A6D1A" : w.status === "paid" ? "#1FA45B" : "#9B948B",
            }}
          >
            {w.status === "pending" ? "대기" : w.status === "paid" ? "입금 완료" : "거절"}
          </span>
        </div>
        <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.8 }}>
          {w.bank} <b>{w.account}</b>
          <br />
          신청 {w.amount.toLocaleString()}P → 원천징수 3.3% {tax.toLocaleString()}원 공제 → <b style={{ color: "var(--brand-dark)" }}>실입금 {pay.toLocaleString()}원</b>
          <br />
          주민등록번호:{" "}
          {rrns[w.id] ? (
            <b>{rrns[w.id]}</b>
          ) : (
            <button className="btn ghost" style={{ padding: "4px 10px", fontSize: 11.5 }} onClick={() => showRrn(w.id)} disabled={busy === w.id + "rrn"}>
              {busy === w.id + "rrn" ? "확인 중…" : "보기 (암호화 해제)"}
            </button>
          )}
        </div>
        {w.status === "pending" && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn pri" style={{ padding: "10px 18px", fontSize: 13 }} onClick={() => markPaid(w.id)} disabled={busy === w.id}>
              입금 완료 처리
            </button>
            <button
              className="btn ghost"
              style={{ padding: "10px 14px", fontSize: 13, color: "#C0392B" }}
              onClick={() => {
                if (confirm(w.name + "님의 출금을 거절할까요? 포인트는 자동 반환돼요.")) reject(w.id);
              }}
              disabled={busy === w.id}
            >
              거절 (포인트 반환)
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="wrap" style={{ maxWidth: 680, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/me" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 마이
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 10 }}>출금 관리</h1>
      <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
        입금 후 "입금 완료 처리"를 눌러주세요. 원천세는 다음 달 10일까지 홈택스 신고!
      </div>

      {msg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#C0392B" }}>{msg}</div>}

      <h2 style={{ fontSize: 16, fontWeight: 900, marginTop: 22 }}>처리 대기 {pending.length}건</h2>
      {pending.length === 0 && <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--ink3)" }}>대기 중인 출금 신청이 없어요.</div>}
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
