"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

type Txn = { id: string; amount: number; memo: string; created_at: string };
type Wd = { id: string; amount: number; bank: string; account: string; status: string; created_at: string };

const BANKS = ["카카오뱅크", "토스뱅크", "국민은행", "신한은행", "우리은행", "하나은행", "농협", "기업은행", "새마을금고", "우체국", "기타"];

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

const WD_STATUS: Record<string, { t: string; c: string }> = {
  pending: { t: "처리 대기", c: "#8A6D1A" },
  paid: { t: "입금 완료", c: "#1FA45B" },
  rejected: { t: "거절(반환됨)", c: "#C0392B" },
};

export default function WalletPage() {
  const supabase = getSupabase();
  const [guest, setGuest] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [account, setAccount] = useState("");
  const [rrn, setRrn] = useState("");
  const [agree, setAgree] = useState(false);
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
    const [{ data: w }, { data: t }, { data: d }] = await Promise.all([
      supabase.from("wallets").select("balance").maybeSingle(),
      supabase.from("point_txns").select("id, amount, memo, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("withdrawals").select("id, amount, bank, account, status, created_at").order("created_at", { ascending: false }).limit(10),
    ]);
    setBalance((w as any)?.balance ?? 0);
    setTxns((t as Txn[]) ?? []);
    setWds((d as Wd[]) ?? []);
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
  const afterTax = Math.floor(amt * 0.967);

  async function submit() {
    setMsg(null);
    if (!supabase) return;
    if (!agree) return setMsg({ ok: false, text: "개인정보 수집·이용에 동의해주세요." });
    setBusy(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setBusy(false);
      return setMsg({ ok: false, text: "로그인이 필요해요." });
    }
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt, name, bank, account, rrn, token: session.access_token }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: body.error ?? "출금 신청에 실패했어요." });
    setMsg({ ok: true, text: "출금 신청 완료! 영업일 기준 2~3일 안에 입금해드려요." });
    setAmount("");
    setRrn("");
    setAgree(false);
    load();
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/my" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 내 신청 내역
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>포인트 · 출금</h1>

      {guest ? (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "var(--chip)", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>로그인 후 이용할 수 있어요.</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            로그인하기
          </Link>
        </div>
      ) : (
        <>
          <div
            style={{
              marginTop: 16,
              borderRadius: 18,
              padding: "22px 22px",
              background: "linear-gradient(115deg,#FF7A45,#F04E1A)",
              color: "#fff",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.85 }}>내 포인트</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4 }}>
              {balance === null ? "…" : balance.toLocaleString()}
              <span style={{ fontSize: 17 }}> P</span>
            </div>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 4 }}>1P = 1원 · 리뷰가 승인되면 자동으로 쌓여요</div>
          </div>

          <h2 style={{ fontSize: 16.5, fontWeight: 900, marginTop: 28 }}>출금 신청</h2>
          <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 3 }}>
            최소 10,000P부터 · 세금 3.3% 공제 후 입금 (예: 10,000P → 9,670원)
          </div>

          <label style={lbl}>출금할 포인트</label>
          <input style={inp} inputMode="numeric" placeholder="예: 30000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {amt >= 10000 && (
            <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 800, color: "var(--brand-dark)" }}>
              실제 입금액: {afterTax.toLocaleString()}원 (원천징수 3.3% 공제)
            </div>
          )}

          <label style={lbl}>예금주 성함 (실명)</label>
          <input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>은행</label>
              <select style={inp} value={bank} onChange={(e) => setBank(e.target.value)}>
                {BANKS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1.6 }}>
              <label style={lbl}>계좌번호</label>
              <input style={inp} inputMode="numeric" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="숫자만 입력" />
            </div>
          </div>

          <label style={lbl}>주민등록번호 (세금 신고용)</label>
          <input
            style={inp}
            inputMode="numeric"
            value={rrn}
            onChange={(e) => setRrn(e.target.value)}
            placeholder="000000-0000000"
            maxLength={14}
          />
          <div style={{ marginTop: 8, background: "var(--chip)", borderRadius: 10, padding: "10px 13px", fontSize: 11, color: "var(--ink2)", lineHeight: 1.65 }}>
            주민등록번호는 소득세법에 따른 원천징수·지급명세서 제출 목적으로만 수집하며, <b>암호화되어 안전하게 보관</b>되고
            법정 보존 기간이 지나면 파기돼요.
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, fontSize: 12.5, fontWeight: 700, cursor: "pointer", lineHeight: 1.5 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 17, height: 17, marginTop: 1 }} />
            개인정보(성명·주민등록번호·계좌번호) 수집·이용에 동의합니다 (목적: 출금 지급 및 세금 신고)
          </label>

          {msg && (
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: msg.ok ? "#1FA45B" : "#C0392B" }}>{msg.text}</div>
          )}

          <button
            className="btn pri"
            style={{ width: "100%", padding: "15px 0", fontSize: 15.5, marginTop: 14, borderRadius: 14 }}
            onClick={submit}
            disabled={busy}
          >
            {busy ? "신청 중…" : "출금 신청하기"}
          </button>

          {wds.length > 0 && (
            <>
              <h2 style={{ fontSize: 16.5, fontWeight: 900, marginTop: 30 }}>출금 신청 내역</h2>
              {wds.map((w) => (
                <div key={w.id} style={{ display: "flex", alignItems: "center", padding: "12px 2px", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                  <div>
                    <b>{w.amount.toLocaleString()}P</b>
                    <span style={{ color: "var(--ink3)", fontSize: 12, marginLeft: 8 }}>
                      {w.bank} {w.account.slice(0, 4)}···
                    </span>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: WD_STATUS[w.status]?.c ?? "var(--ink3)" }}>
                    {WD_STATUS[w.status]?.t ?? w.status}
                  </span>
                </div>
              ))}
            </>
          )}

          {txns.length > 0 && (
            <>
              <h2 style={{ fontSize: 16.5, fontWeight: 900, marginTop: 30 }}>포인트 내역</h2>
              {txns.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "12px 2px", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                  <div>
                    {t.memo}
                    <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 2 }}>{new Date(t.created_at).toLocaleDateString("ko-KR")}</div>
                  </div>
                  <b style={{ marginLeft: "auto", color: t.amount > 0 ? "var(--brand-dark)" : "var(--ink2)" }}>
                    {t.amount > 0 ? "+" : ""}
                    {t.amount.toLocaleString()}P
                  </b>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
