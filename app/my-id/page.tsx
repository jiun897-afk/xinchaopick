"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

/* 내 아이디 설정 + QR (카톡처럼 친구 추가용) */
export default function MyIdPage() {
  const supabase = getSupabase();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [handle, setHandle] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setReady(true);
        return;
      }
      setLoggedIn(true);
      const { data: p } = await supabase.from("profiles").select("handle").eq("id", session.user.id).maybeSingle();
      const h = (p as any)?.handle ?? null;
      setSaved(h);
      setHandle(h ?? "");
      setReady(true);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!saved || !canvasRef.current) return;
    (async () => {
      // @ts-ignore
      const QRCode = (await import("qrcode")).default ?? (await import("qrcode"));
      QRCode.toCanvas(canvasRef.current, "https://vejaview.com/add?h=" + saved, {
        width: 220,
        margin: 2,
        color: { dark: "#26211C", light: "#FFFFFF" },
      });
    })();
  }, [saved]);

  async function save() {
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.rpc("set_my_handle", { p_handle: handle });
    setBusy(false);
    if (error) setMsg({ t: error.message, ok: false });
    else {
      setSaved(handle.toLowerCase().trim());
      setMsg({ t: "저장됐어요! 아래 QR로 친구를 추가받을 수 있어요.", ok: true });
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 480, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/me" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>← 마이</Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>내 아이디 · QR</h1>
      <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 6, lineHeight: 1.7 }}>
        아이디를 아는 사람만 나에게 1:1 채팅을 걸 수 있어요. 카톡 아이디처럼 쓰면 돼요.
      </p>

      {!ready ? (
        <div style={{ marginTop: 20, fontSize: 13, color: "var(--ink3)" }}>확인 중…</div>
      ) : !loggedIn ? (
        <Link className="btn pri" style={{ marginTop: 18, padding: "12px 22px" }} href="/login">로그인하기</Link>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <input
              style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--line)", borderRadius: 12, padding: "13px 15px", fontSize: 15, fontFamily: "inherit", outline: "none" }}
              placeholder="영문 소문자·숫자 4~20자"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              maxLength={20}
            />
            <button className="btn pri" style={{ padding: "0 20px" }} disabled={busy || handle.length < 4} onClick={save}>
              {busy ? "저장 중…" : saved ? "변경" : "저장"}
            </button>
          </div>
          {msg && <div className={"notice " + (msg.ok ? "ok" : "err")} style={{ marginTop: 12 }}>{msg.t}</div>}

          {saved && (
            <div style={{ marginTop: 24, border: "1px solid var(--line)", borderRadius: 20, padding: "24px 20px", textAlign: "center", background: "#fff" }}>
              <div style={{ fontSize: 14.5, fontWeight: 900 }}>@{saved}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 3, marginBottom: 14 }}>
                이 QR을 상대가 카메라로 찍으면 바로 친구 추가 화면이 열려요
              </div>
              <canvas ref={canvasRef} style={{ borderRadius: 12 }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
