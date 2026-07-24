"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import AvatarCrop from "../../components/AvatarCrop";

export default function MePage() {
  const supabase = getSupabase();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [upBusy, setUpBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase || !email) return;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data: p } = await supabase.from("profiles").select("avatar_url").eq("id", session.user.id).maybeSingle();
      setAvatar((p as any)?.avatar_url ?? null);
    })();
  }, [supabase, email]);

  /* 파일 선택 → (HEIC 변환) → 크롭 화면 열기 */
  async function pickAvatar(f: File) {
    if (f.size > 20 * 1024 * 1024) {
      alert("사진은 20MB 이하로 올려주세요.");
      return;
    }
    setUpBusy(true);
    try {
      let src: Blob = f;
      let ok = await createImageBitmap(src).then(() => true).catch(() => false);
      if (!ok) {
        try {
          // @ts-ignore
          const heic2any = (await import("heic2any")).default;
          const out = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.9 });
          src = Array.isArray(out) ? out[0] : out;
          ok = await createImageBitmap(src).then(() => true).catch(() => false);
        } catch {}
      }
      if (!ok) {
        alert("이 사진은 읽을 수 없었어요. 다른 사진을 선택해주세요.");
        return;
      }
      setCropSrc(URL.createObjectURL(src));
    } finally {
      setUpBusy(false);
    }
  }

  /* 크롭 완료된 사진 업로드 */
  async function uploadAvatar(blob: Blob) {
    if (!supabase) return;
    setUpBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const path = session.user.id + "/avatar_" + Date.now() + ".jpg";
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) {
        alert("업로드 실패: " + error.message);
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: e2 } = await supabase.rpc("set_my_avatar", { p_url: pub.publicUrl });
      if (e2) {
        alert("프로필 저장 실패: " + e2.message);
        return;
      }
      setAvatar(pub.publicUrl);
    } finally {
      setUpBusy(false);
    }
  }

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

  // 비로그인 상태: 로그인 유도 화면만 표시
  if (ready && !email) {
    return (
      <div className="wrap" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 90 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>마이</h1>
        <div style={{ textAlign: "center", padding: "70px 20px 40px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--brand-bg)",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}
          >
            🔒
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, marginTop: 18 }}>로그인이 필요해요</div>
          <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
            신청 내역, 포인트, 알림, 사장님 센터는
            <br />
            로그인 후 이용할 수 있어요.
          </p>
          <Link className="btn pri" style={{ marginTop: 22, padding: "14px 40px", fontSize: 15 }} href="/login">
            로그인 · 3초 가입
          </Link>
        </div>
        <div style={{ marginTop: 26, fontSize: 10.5, color: "var(--ink3)", lineHeight: 1.8, textAlign: "center" }}>
          <Link href="/terms" style={{ textDecoration: "underline" }}>이용약관</Link> ·{" "}
          <Link href="/privacy" style={{ textDecoration: "underline" }}>개인정보처리방침</Link> · 고객센터 1666-0464
        </div>
      </div>
    );
  }

  if (ready === false) {
    return (
      <div className="wrap" style={{ maxWidth: 720, paddingTop: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>마이</h1>
        <div style={{ marginTop: 20, fontSize: 13.5, color: "var(--ink3)" }}>확인 중…</div>
      </div>
    );
  }

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
        <div style={{ position: "relative", flexShrink: 0, cursor: email ? "pointer" : "default" }} onClick={() => email && setPicker(true)}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              backgroundColor: avatar ? "var(--chip)" : "var(--brand)",
              backgroundImage: avatar ? "url(" + avatar + ")" : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              color: "#fff",
              fontWeight: 900,
              fontSize: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!avatar && (nick ? nick[0].toUpperCase() : "?")}
          </div>
          {email && (
            <span
              style={{
                position: "absolute",
                right: -3,
                bottom: -3,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                border: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
              }}
            >
              {upBusy ? "…" : "📷"}
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pickAvatar(f); }}
          />
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pickAvatar(f); }}
          />
        </div>
        {cropSrc && (
          <AvatarCrop
            src={cropSrc}
            onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); }}
            onDone={(b) => { URL.revokeObjectURL(cropSrc); setCropSrc(null); uploadAvatar(b); }}
          />
        )}
        {picker && (
          <div
            onClick={() => setPicker(false)}
            style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(20,15,10,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "22px 22px 0 0", padding: "18px 18px 26px" }}>
              <div style={{ fontSize: 14.5, fontWeight: 900, marginBottom: 12 }}>프로필 사진</div>
              <div
                onClick={() => { setPicker(false); camRef.current?.click(); }}
                style={{ padding: "14px 4px", borderBottom: "1px solid var(--line)", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}
              >
                📷 사진 찍기
              </div>
              <div
                onClick={() => { setPicker(false); fileRef.current?.click(); }}
                style={{ padding: "14px 4px", borderBottom: "1px solid var(--line)", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}
              >
                🖼️ 앨범에서 선택
              </div>
              {avatar && (
                <div
                  onClick={async () => {
                    setPicker(false);
                    if (!supabase || !confirm("프로필 사진을 삭제할까요?")) return;
                    await supabase.rpc("set_my_avatar", { p_url: null });
                    setAvatar(null);
                  }}
                  style={{ padding: "14px 4px", fontSize: 14.5, fontWeight: 700, color: "#C0392B", cursor: "pointer" }}
                >
                  🗑 사진 삭제
                </div>
              )}
            </div>
          </div>
        )}
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
          { href: "/my-id", label: "내 아이디 · QR (친구 추가)" },
          { href: "/blocked", label: "차단 관리" },
          { href: "/my", label: "내 신청 내역" },
          { href: "/my-coupons", label: "내 쿠폰함" },
          { href: "/wallet", label: "포인트 · 출금" },
          { href: "/chat", label: "채팅 (선정된 캠페인)" },
          { href: "/blog", label: "내 블로그 등급 (리뷰어)" },
          { href: "/owner", label: "사장님 센터 (캠페인 등록·선정)" },
          { href: "/owner/places", label: "내 업체 관리" },
          { href: "/owner/topup", label: "크레딧 충전 (사장님)" },
          { href: "/owner/coupons", label: "쿠폰 관리 (사장님)" },
          { href: "/saved", label: "찜한 캠페인" },
          { href: "/community", label: "커뮤니티 (오픈 준비중)" },
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
