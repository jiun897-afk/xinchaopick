import Link from "next/link";

function Piky() {
  return (
    <svg viewBox="0 0 120 130" style={{ width: 84, height: 91, margin: "0 auto", display: "block" }}>
      <path d="M60 122 C60 122 30 88 30 62 A30 30 0 1 1 90 62 C90 88 60 122 60 122 Z" fill="#FFF6EB" />
      <circle cx="49" cy="61" r="3.6" fill="#3A2A1A" />
      <circle cx="71" cy="61" r="3.6" fill="#3A2A1A" />
      <path d="M52 70 Q60 78 68 70" stroke="#3A2A1A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="69" r="4.5" fill="#FFC4A0" />
      <circle cx="80" cy="69" r="4.5" fill="#FFC4A0" />
      <path d="M60 8 C64 8 88 28 94 36 L26 36 C32 28 56 8 60 8 Z" fill="#FFDDBB" />
      <path d="M18 36 Q60 48 102 36 Q98 42 60 44 Q22 42 18 36 Z" fill="#F3A469" />
    </svg>
  );
}

export default function CommunityPage() {
  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 90 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>커뮤니티</h1>
      <div style={{ textAlign: "center", padding: "70px 20px" }}>
        <Piky />
        <div style={{ fontSize: 17, fontWeight: 800, marginTop: 18 }}>커뮤니티, 준비 중이에요</div>
        <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
          다낭 정보, 체험 후기 자랑, 동행 구하기까지 —
          <br />
          한국인 리뷰어들의 아지트가 될 공간이에요.
        </p>
        <Link className="btn pri" style={{ marginTop: 20, padding: "12px 24px" }} href="/">
          체험단 둘러보기
        </Link>
      </div>
    </div>
  );
}
