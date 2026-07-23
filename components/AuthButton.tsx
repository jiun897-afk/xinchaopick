"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabase";

export default function AuthButton() {
  const supabase = getSupabase();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  if (!ready) {
    return <div className="hcta" style={{ width: 180 }} />;
  }

  if (userEmail) {
    const short = userEmail.length > 22 ? userEmail.slice(0, 20) + "…" : userEmail;
    return (
      <div className="hcta">
        <Link className="btn ghost" href="/my">
          내 신청
        </Link>
        <Link
          href="/login"
          className="authchip"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1.5px solid var(--line)",
            borderRadius: 12,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--brand)",
              color: "#fff",
              fontWeight: 900,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {userEmail[0].toUpperCase()}
          </span>
          <span className="authmail">{short}</span>
          <span className="authmail" style={{ color: "var(--green)", fontSize: 11, fontWeight: 800 }}>로그인됨</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="hcta">
      <Link className="btn ghost" href="/login">
        로그인
      </Link>
      <Link className="btn pri" href="/login">
        시작하기
      </Link>
    </div>
  );
}
