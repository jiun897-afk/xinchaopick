"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

const GRADE_META: Record<string, { c: string; bg: string; desc: string }> = {
  "파워": { c: "#F04E1A", bg: "#FFF0E8", desc: "상위 등급! 선정 확률이 크게 올라가요" },
  "인기": { c: "#1A56DB", bg: "#E8F0FE", desc: "활발한 블로거예요" },
  "성장": { c: "#1FA45B", bg: "#E8F7EF", desc: "꾸준히 성장 중이에요" },
  "새싹": { c: "#8A6D1A", bg: "#FFF4E0", desc: "포스팅을 늘리면 등급이 올라가요" },
};

export default function BlogPage() {
  const supabase = getSupabase();
  const [guest, setGuest] = useState(false);
  const [url, setUrl] = useState("");
  const [grade, setGrade] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!supabase) {
      setGuest(true);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setGuest(true);
        return;
      }
      const { data } = await supabase.from("profiles").select("blog_url, blog_grade, blog_stats, blog_verified, blog_verify_code").eq("id", session.user.id).maybeSingle();
      if (data) {
        setUrl((data as any).blog_url ?? "");
        setGrade((data as any).blog_grade ?? null);
        setStats((data as any).blog_stats ?? null);
        setVerified(!!(data as any).blog_verified);
        setCode((data as any).blog_verify_code ?? null);
      }
    })();
  }, [supabase]);

  async function check() {
    if (!supabase) return;
    setMsg("");
    if (!url.trim()) return setMsg("네이버 블로그 주소를 입력해주세요.");
    setBusy(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setBusy(false);
      return setMsg("로그인이 필요해요.");
    }
    // 인증 코드가 없으면 생성해서 저장
    let myCode = code;
    if (!myCode) {
      myCode = "베자뷰" + Math.random().toString(36).slice(2, 7).toUpperCase();
      await supabase.from("profiles").update({ blog_verify_code: myCode }).eq("id", session.user.id);
      setCode(myCode);
    }
    const res = await fetch("/api/blog/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: session.access_token, blogUrl: url.trim() }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(body.error ?? "확인에 실패했어요.");
    setGrade(body.grade);
    setStats(body.stats);
    setVerified(body.verified);
    setMsg("");
  }

  const gm = grade ? GRADE_META[grade] ?? GRADE_META["새싹"] : null;

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/me" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 마이
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>내 블로그 등급</h1>
      <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
        블로그를 등록하면 활동 지표로 등급이 매겨져요 — 등급이 높을수록 선정 확률 UP! (매일 밤 자동 갱신)
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
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 800, margin: "18px 0 6px" }}>네이버 블로그 주소</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--line)", borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff" }}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="blog.naver.com/아이디"
            />
            <button className="btn pri" style={{ padding: "0 16px", fontSize: 13, flexShrink: 0 }} onClick={check} disabled={busy}>
              {busy ? "분석 중…" : grade ? "다시 확인" : "등급 확인"}
            </button>
          </div>
          {msg && <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: "#C0392B" }}>{msg}</div>}

          {grade && gm && (
            <div style={{ marginTop: 18, border: "1px solid var(--line)", borderRadius: 18, padding: "20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: gm.bg, color: gm.c, fontSize: 17, fontWeight: 900, borderRadius: 12, padding: "8px 16px" }}>{grade}</span>
                {verified ? (
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "#1FA45B" }}>✓ 본인 블로그 인증됨</span>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink3)" }}>미인증</span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink2)", marginTop: 8 }}>{gm.desc}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
                <div style={{ background: "var(--chip)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 900 }}>{stats?.posts30 ?? 0}</div>
                  <div style={{ fontSize: 10, color: "var(--ink3)", fontWeight: 700 }}>최근 30일 글</div>
                </div>
                <div style={{ background: "var(--chip)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 900 }}>{stats?.lastPostDays != null ? stats.lastPostDays + "일 전" : "-"}</div>
                  <div style={{ fontSize: 10, color: "var(--ink3)", fontWeight: 700 }}>마지막 포스팅</div>
                </div>
                <div style={{ background: "var(--chip)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 900 }}>{stats?.visitors5d != null ? Number(stats.visitors5d).toLocaleString() : "비공개"}</div>
                  <div style={{ fontSize: 10, color: "var(--ink3)", fontWeight: 700 }}>최근 5일 방문</div>
                </div>
              </div>
              {stats?.keywords?.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink2)" }}>
                  주요 키워드:{" "}
                  {stats.keywords.map((k: string) => (
                    <span key={k} style={{ background: "var(--brand-bg)", color: "var(--brand-dark)", fontWeight: 800, borderRadius: 7, padding: "3px 9px", marginRight: 5, fontSize: 11.5 }}>
                      {k}
                    </span>
                  ))}
                </div>
              )}
              {stats?.rank && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--brand-dark)" }}>
                  &ldquo;{stats.rank.keyword}&rdquo; 블로그 검색 {stats.rank.rank}위 노출 중!
                </div>
              )}
            </div>
          )}

          {grade && !verified && code && (
            <div style={{ marginTop: 14, background: "var(--brand-bg)", borderRadius: 14, padding: "14px 16px", fontSize: 12.5, lineHeight: 1.7 }}>
              <b>본인 블로그 인증하기</b> — 다른 사람 블로그 도용을 막기 위한 절차예요.
              <br />
              ① 내 블로그에 새 글을 쓰면서 제목에 <b style={{ color: "var(--brand-dark)" }}>{code}</b> 를 포함해 발행
              <br />
              ② 위의 &ldquo;다시 확인&rdquo; 버튼 클릭 → 인증 완료! (인증 후 글은 지워도 돼요)
            </div>
          )}
        </>
      )}
    </div>
  );
}
