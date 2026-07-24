"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

export default function MePage() {
  const supabase = getSupabase();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function logout() {
    if (supabase) await supabase.auth.signOut();
  }

  async function deleteAccount() {
    if (!supabase || !email) return;
    if (
      !confirm(
        "정말 탈퇴할까요?\n\n포인트·크레딧·신청 내역·업체 정보가 모두 삭제되며 복구할 수 없어요.\n잔여 포인트가 있다면 먼저 출금을 완료해주세요."
      )
    )
      return;
    const typed = prompt("탈퇴하려면 '탈퇴'라고 입력해주세요.");
    if (typed !== "탈퇴") return;
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      alert("탈퇴 처리 중 문제가 생겼어요: " + error.message);
      return;
    }
    await supabase.auth.signOut();
    alert("탈퇴가 완료됐어요. 그동안 이용해주셔서 감사합니다.");
    window.location.href = "/";
  }

  const nick = email ? email.split("@")[0] : null;

  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 90 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>마이</h1>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
          border: "1px solid var(--line)",
          borderRadius: 18,
          padding: "18px 18px",
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "var(--brand)",
            color: "#fff",
            fontWeight: 900,
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {nick ? nick[0].toUpperCase() : "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {!ready ? (
            <div style={{ fontSize: 14, color: "var(--ink3)" }}>확인 중…</div>
          ) : email ? (
            <>
              <div style={{ fontSize: 16.5, fontWeight: 800 }}>{nick}님</div>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>{email}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 800 }}>로그인이 필요해요</div>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>
                이메일로 3초 만에 시작
              </div>
            </>
          )}
        </div>
        {ready &&
          (email ? (
            <button className="btn ghost" style={{ padding: "9px 14px", fontSize: 12.5 }} onClick={logout}>
              로그아웃
            </button>
          ) : (
            <Link className="btn pri" style={{ padding: "10px 16px", fontSize: 13 }} href="/login">
              로그인
            </Link>
          ))}
      </div>

      <div style={{ marginTop: 18, borderTop: "1px solid var(--line)" }}>
        {[
          { href: "/notifications", label: "알림" },
          { href: "/my", label: "내 신청 내역" },
          { href: "/wallet", label: "포인트 · 출금" },
          { href: "/chat", label: "채팅 (선정된 캠페인)" },
          { href: "/blog", label: "내 블로그 등급 (리뷰어)" },
          { href: "/owner", label: "사장님 센터 (캠페인 등록·선정)" },
          { href: "/owner/places", label: "내 업체 관리" },
          { href: "/owner/topup", label: "크레딧 충전 (사장님)" },
          { href: "/owner/coupons", label: "쿠폰 관리 (사장님)" },
          { href: "/saved", label: "찜한 캠페인" },
          { href: "/partner", label: "사장님 입점 안내" },
          ...(email === "admin@jmgroup.kr"
            ? [
                { href: "/admin/banners", label: "홈 배너 관리 (운영자)" },
                { href: "/admin/withdrawals", label: "출금 관리 (운영자)" },
                { href: "/admin/topups", label: "충전 관리 (운영자)" },
                { href: "/admin/disputes", label: "분쟁 중재 (운영자)" },
                { href: "/admin/reports", label: "후기 신고 관리 (운영자)" },
                { href: "/admin.html", label: "운영 콘솔 (관리자)" },
                { href: "/app.html", label: "앱 디자인 시안 (설계도)" },
              ]
            : []),
        ].map((m) => (
          <Link
            key={m.href}
            href={m.href}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 4px",
              borderBottom: "1px solid var(--line)",
              fontSize: 14.5,
              fontWeight: 700,
            }}
          >
            {m.label}
            <span style={{ marginLeft: "auto", color: "var(--ink3)" }}>›</span>
          </Link>
        ))}
        <div style={{ display: "flex", alignItems: "center", padding: "16px 4px", borderBottom: "1px solid var(--line)", fontSize: 14.5, fontWeight: 700 }}>
          고객센터
          <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--ink3)", fontWeight: 600 }}>
            1666-0464 · 카카오톡 @베자뷰
          </span>
        </div>
      </div>

      <div style={{ marginTop: 26, fontSize: 10.5, color: "var(--ink3)", lineHeight: 1.8 }}>
        주식회사 더제이엠그룹 · 대표이사 이정목
        <br />
        서울특별시 서초구 방배동 451-24 현성빌딩 3층
        <br />
        사업자등록번호 352-87-00902 · 고객센터 1666-0464
        <br />
        <Link href="/terms" style={{ textDecoration: "underline" }}>이용약관</Link> ·{" "}
        <Link href="/privacy" style={{ textDecoration: "underline" }}>개인정보처리방침</Link>
        {email && (
          <>
            {" · "}
            <span onClick={deleteAccount} style={{ textDecoration: "underline", cursor: "pointer" }}>
              회원 탈퇴
            </span>
          </>
        )}
      </div>
    </div>
  );
}
