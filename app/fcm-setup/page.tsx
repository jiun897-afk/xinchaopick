"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

/* 운영자 전용: FCM 발송 키 등록 (키는 브라우저 → 서버 금고로 직행) */
export default function FcmSetupPage() {
  const supabase = getSupabase();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setReady(true);
    });
  }, [supabase]);

  async function upload(f: File) {
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    try {
      const txt = await f.text();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/fcm-sa", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (session?.access_token ?? "") },
        body: JSON.stringify({ sa: txt }),
      });
      const j = await res.json();
      if (res.ok) setMsg({ t: "✅ 등록 완료! 이제 앱 푸시가 살아났어요.", ok: true });
      else setMsg({ t: "❌ " + (j.error ?? "실패"), ok: false });
    } catch (e: any) {
      setMsg({ t: "❌ " + e.message, ok: false });
    }
    setBusy(false);
  }

  return (
    <div className="wrap" style={{ maxWidth: 480, paddingTop: 40, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>앱 푸시 키 등록 (운영자)</h1>
      <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
        Firebase 서비스 계정 키(vejaview-firebase-adminsdk-….json)를 선택하면 발송 서버 금고에 저장돼요. 키 내용은
        화면에 표시되지 않아요.
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
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <button className="btn pri" style={{ width: "100%", padding: "16px 0", fontSize: 15.5 }} disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? "등록 중…" : "📁 키 파일 선택 (다운로드 폴더)"}
          </button>
          {msg && <div className={"notice " + (msg.ok ? "ok" : "err")} style={{ marginTop: 14 }}>{msg.t}</div>}
        </div>
      )}
    </div>
  );
}
