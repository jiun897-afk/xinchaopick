"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";

/* 입금 계좌 — 실제 계좌로 교체 필요 */
const ACCOUNTS = {
  KR: { label: "한국 계좌", info: "IBK기업은행 201-073049-01-013 · 예금주: 주식회사 더제이엠그룹" },
  VN: { label: "베트남 계좌", info: "베트남 계좌는 준비 중이에요 — 카카오톡 채널 @베자뷰로 문의해주세요" },
};

type Topup = { id: string; amount: number; depositor: string; bank_type: string; status: string; created_at: string };

const inp: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--line)",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14.5,
  fontFamily: "inherit",
  outline: "none",
  background: "#fff",
};
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 800, margin: "14px 0 6px" };

const ST: Record<string, { t: string; c: string }> = {
  pending: { t: "입금 확인 중", c: "#8A6D1A" },
  paid: { t: "충전 완료", c: "#1FA45B" },
  rejected: { t: "확인 실패", c: "#C0392B" },
};

export default function TopupPage() {
  const supabase = getSupabase();
  const [guest, setGuest] = useState(false);
  const [credit, setCredit] = useState<number | null>(null);
  const [list, setList] = useState<Topup[]>([]);
  const [bankType, setBankType] = useState<"KR" | "VN">("KR");
  const [depositor, setDepositor] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setGuest(true);
      return;
    }
    const [{ data: w }, { data: t }] = await Promise.all([
      supabase.from("owner_wallets").select("balance").maybeSingle(),
      supabase.from("topups").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(15),
    ]);
    setCredit((w as any)?.balance ?? 0);
    setList((t as Topup[]) ?? []);
  }

  useEffect(() => {
    if (!supabase) {
      setGuest(true);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const amt = Number(amount.replace(/[^0-9]/g, "")) || 0;

  async function submit() {
    setMsg(null);
    if (!supabase) return;
    if (amt < 10000) return setMsg({ ok: false, text: "최소 충전 금액은 10,000원이에요." });
    if (!depositor.trim()) return setMsg({ ok: false, text: "입금자명을 입력해주세요." });
    setBusy(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setBusy(false);
      return setMsg({ ok: false, text: "로그인이 필요해요." });
    }
    const { error } = await supabase.from("topups").insert({
      user_id: session.user.id,
      amount: amt,
      depositor: depositor.trim(),
      bank_type: bankType,
    });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: "신청 실패: " + error.message });
    setMsg({ ok: true, text: "충전 신청 완료! 입금이 확인되면 크레딧이 충전돼요 (영업시간 기준 보통 몇 시간 안)." });
    setAmount("");
    setDepositor("");
    load();
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/owner" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 사장님 센터
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>크레딧 충전</h1>
      <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
        포인트 지급형 캠페인에 쓰는 크레딧이에요 (1크레딧 = 1원)
      </div>

      {guest ? (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "var(--chip)", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>로그인 후 이용할 수 있어요.</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            로그인하기
          </Link>
        </div>
      ) : (
        <>
          <div style={{ marginTop: 16, borderRadius: 18, padding: "20px 22px", background: "linear-gradient(115deg,#2A2118,#4A3520)", color: "#fff" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.8 }}>내 크레딧</div>
            <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>
              {credit === null ? "…" : credit.toLocaleString()}
              <span style={{ fontSize: 16 }}> P</span>
            </div>
          </div>

          <h2 style={{ fontSize: 16.5, fontWeight: 900, marginTop: 26 }}>충전 신청</h2>
          <div style={{ fontSize: 12, color: "var(--ink2)", marginTop: 4, lineHeight: 1.65 }}>
            ① 아래로 입금 → ② 입금 정보 입력 → ③ 운영팀 확인 후 충전 완료
          </div>

          <label style={lbl}>입금할 계좌</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(Object.keys(ACCOUNTS) as ("KR" | "VN")[]).map((k) => (
              <div
                key={k}
                onClick={() => setBankType(k)}
                style={{
                  flex: 1,
                  border: bankType === k ? "2px solid var(--brand)" : "1.5px solid var(--line)",
                  background: bankType === k ? "var(--brand-bg)" : "#fff",
                  borderRadius: 12,
                  padding: "12px 13px",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>{ACCOUNTS[k].label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, background: "var(--chip)", borderRadius: 10, padding: "11px 14px", fontSize: 12.5, fontWeight: 700, color: "var(--ink2)" }}>
            {ACCOUNTS[bankType].info}
          </div>

          <label style={lbl}>입금자명</label>
          <input style={inp} value={depositor} onChange={(e) => setDepositor(e.target.value)} placeholder="이체할 때 표시되는 이름 그대로" />

          <label style={lbl}>입금 금액 (원)</label>
          <input style={inp} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="예: 300000" />
          {amt >= 10000 && (
            <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 800, color: "var(--brand-dark)" }}>
              충전될 크레딧: {amt.toLocaleString()}P
            </div>
          )}

          {msg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: msg.ok ? "#1FA45B" : "#C0392B" }}>{msg.text}</div>}

          <button className="btn pri" style={{ width: "100%", padding: "15px 0", fontSize: 15.5, marginTop: 14, borderRadius: 14 }} onClick={submit} disabled={busy}>
            {busy ? "신청 중…" : "충전 신청하기"}
          </button>

          {list.length > 0 && (
            <>
              <h2 style={{ fontSize: 16.5, fontWeight: 900, marginTop: 30 }}>충전 신청 내역</h2>
              {list.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "12px 2px", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                  <div>
                    <b>{t.amount.toLocaleString()}원</b>
                    <span style={{ color: "var(--ink3)", fontSize: 12, marginLeft: 8 }}>
                      {t.depositor} · {t.bank_type === "KR" ? "한국" : "베트남"} · {new Date(t.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: ST[t.status]?.c ?? "var(--ink3)" }}>
                    {ST[t.status]?.t ?? t.status}
                  </span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
