"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

/* 운영자 전용: AI 번역 키 등록 (키는 브라우저 → 서버 금고로 직행) */
export default function AiSetupPage() {
  const supabase = getSupabase();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setReady(true);
    });
  }, [supabase]);

  async function save() {
    if (!supabase || !key.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/openai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session?.access_token ?? "") },
        body: JSON.stringify({ key: key.trim() }),
      });
      const j = await res.json();
      if (res.ok) {
        setMsg({ t: "✅ 등록 완료! 채팅 자동 번역이 살아났어요.", ok: true });
        setKey("");
      } else setMsg({ t: "❌ " + (j.error ?? "실패"), ok: false });
    } catch (e: any) {
      setMsg({ t: "❌ " + e.message, ok: false });
    }
    setBusy(false);
  }

  return (
    <div className="wrap" style={{ maxWidth: 480, paddingTop: 40, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>AI 번역 키 등록 (운영자)</h1>
      <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
        OpenAI API 키(sk-…)를 붙여넣으면 발송 서버 금고에 저장돼요. 키 내용은 화면에 표시되지 않고, 등록 시 실제로
        동작하는 키인지 자동으로 확인해요.
      </p>
      {!ready ? (
        <div style={{ marginTop: 20, fontSize: 13, color: "var(--ink3)" }}>확인 중…</div>
      ) : email !== "admin@jmgroup.kr" ? (
        <div style={{ marginTop: 20 }}>
          <div className="notice info">운영자 계정(admin@jmgroup.kr)으로 로그인해야 해요. {email ? "(현재: " + email + ")" : ""}</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "12px 22px" }} href="/login">
            로그인하기
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 22 }}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-proj-… 키 붙여넣기"
            autoComplete="off"
            style={{ width: "100%", border: "1.5px solid var(--line)", borderRadius: 14, padding: "14px 16px", fontSize: 14, fontFamily: "inherit", outline: "none" }}
          />
          <button className="btn pri" style={{ width: "100%", marginTop: 12, padding: "14px 0" }} disabled={busy || !key.trim()} onClick={save}>
            {busy ? "확인 중…" : "금고에 등록"}
          </button>
          {msg && (
            <div className={"notice " + (msg.ok ? "ok" : "warn")} style={{ marginTop: 14 }}>
              {msg.t}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
