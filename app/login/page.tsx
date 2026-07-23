"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

export default function LoginPage() {
  const supabase = getSupabase();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function sendLink() {
    if (!supabase || !email.includes("@")) return;
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.href : undefined },
    });
    if (error) {
      setErrMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  async function pwLogin() {
    if (!supabase || !email.includes("@") || !pw) return;
    setStatus("sending");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) {
      setErrMsg(error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 맞지 않아요." : error.message);
      setStatus("error");
    } else {
      setStatus("idle");
    }
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <div className="login-box">
      <Link href="/" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 홈으로
      </Link>
      <h1 style={{ marginTop: 18 }}>
        <span style={{ color: "var(--brand-dark)" }}>베자뷰</span> 로그인
      </h1>

      {!supabase ? (
        <div className="notice info">
          아직 데이터베이스(Supabase)가 연결되지 않았어요. Vercel 환경변수 설정 후 이 화면에서 실제
          로그인이 가능해집니다.
        </div>
      ) : checking ? (
        <div className="notice info">확인 중…</div>
      ) : userEmail ? (
        <>
          <div className="userchip">
            <span className="av">{userEmail[0].toUpperCase()}</span>
            {userEmail}
            <span style={{ marginLeft: "auto", color: "var(--green)", fontSize: 12 }}>로그인됨</span>
          </div>
          <div className="notice ok">
            로그인 성공! 계정이 데이터베이스에 실제로 생성됐어요. (카카오·구글 로그인은 다음 단계에서
            추가됩니다)
          </div>
          <button className="btn ghost" style={{ width: "100%", marginTop: 12, padding: "13px 0" }} onClick={logout}>
            로그아웃
          </button>
        </>
      ) : (
        <>
          <div className="desc">
            이메일을 입력하면 로그인 링크를 보내드려요. 비밀번호가 필요 없어요.
          </div>
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendLink()}
          />
          <button className="btn pri" onClick={sendLink} disabled={status === "sending"}>
            {status === "sending" ? "보내는 중…" : "로그인 링크 받기"}
          </button>
          {status === "sent" && (
            <div className="notice ok">
              메일함을 확인하세요! 받은 링크를 누르면 이 화면으로 돌아오면서 로그인됩니다.
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 12px" }}>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span style={{ fontSize: 11.5, color: "var(--ink3)", fontWeight: 700 }}>또는 비밀번호로 로그인</span>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pwLogin()}
          />
          <button className="btn ghost" style={{ width: "100%", padding: "13px 0", marginTop: 8 }} onClick={pwLogin} disabled={status === "sending"}>
            비밀번호로 로그인
          </button>
          {status === "error" && <div className="notice err">오류: {errMsg}</div>}
        </>
      )}
    </div>
  );
}
