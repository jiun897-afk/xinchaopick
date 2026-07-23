import Link from "next/link";

function Piky() {
  return (
    <svg viewBox="0 0 120 130" style={{ width: 84, height: 91, margin: "0 auto", display: "block" }}>
      <path d="M60 122 C60 122 30 88 30 62 A30 30 0 1 1 90 62 C90 88 60 122 60 122 Z" fill="#F55B24" />
      <circle cx="49" cy="61" r="3.6" fill="#fff" />
      <circle cx="71" cy="61" r="3.6" fill="#fff" />
      <path d="M52 70 Q60 78 68 70" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M60 8 C64 8 88 28 94 36 L26 36 C32 28 56 8 60 8 Z" fill="#FFDDBB" />
      <path d="M18 36 Q60 48 102 36 Q98 42 60 44 Q22 42 18 36 Z" fill="#F3A469" />
    </svg>
  );
}

export default function SavedPage() {
  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 90 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>찜한 캠페인</h1>
      <div style={{ textAlign: "center", padding: "70px 20px" }}>
        <Piky />
        <div style={{ fontSize: 17, fontWeight: 800, marginTop: 18 }}>찜 기능, 곧 열려요</div>
        <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
          마음에 드는 캠페인을 모아두고
          <br />
          마감이 다가오면 알림을 받게 될 거예요.
        </p>
        <Link className="btn pri" style={{ marginTop: 20, padding: "12px 24px" }} href="/">
          체험단 둘러보기
        </Link>
      </div>
    </div>
  );
}
