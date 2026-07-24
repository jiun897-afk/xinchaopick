"use client";
/* 홈에서 체험단 ↔ 사장님 모드 전환.
   사장님 모드로 전환하면 저장돼서, 다음에 홈을 열어도 사장님 센터로 바로 이동 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "../lib/i18n";

export default function ModeSwitch() {
  const router = useRouter();
  const [lang] = useLang();
  const vi = lang === "vi";

  useEffect(() => {
    try {
      if (localStorage.getItem("bv_mode") === "owner") router.replace("/owner");
    } catch {}
  }, [router]);

  function goOwner() {
    try {
      localStorage.setItem("bv_mode", "owner");
    } catch {}
    router.push("/owner");
  }

  return (
    <div
      onClick={goOwner}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        border: "1px solid var(--line)",
        background: "#fff",
        borderRadius: 14,
        padding: "11px 14px",
        marginTop: 12,
        cursor: "pointer",
      }}
    >
      <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--brand-bg)", color: "var(--brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l1.5-5h15L21 9" />
          <path d="M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
          <path d="M9 21v-6h6v6" />
        </svg>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12, color: "var(--ink3)", fontWeight: 700 }}>
          {vi ? "Đang xem chế độ trải nghiệm" : "지금 체험단 화면을 보고 있어요"}
        </span>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 900, marginTop: 1 }}>
          {vi ? "Chủ quán? Chuyển sang chế độ đối tác" : "사장님이신가요? 사장님 모드로 전환"}
        </span>
      </span>
      <span style={{ color: "var(--ink3)", fontWeight: 900 }}>›</span>
    </div>
  );
}
