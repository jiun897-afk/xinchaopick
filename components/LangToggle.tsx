"use client";
/* 한국어 ↔ Tiếng Việt 전환 버튼 (버튼에는 '전환하면 바뀔 언어'를 표시) */
import { useLang } from "../lib/i18n";

export default function LangToggle() {
  const [lang, setLang] = useLang();
  return (
    <button
      onClick={() => setLang(lang === "ko" ? "vi" : "ko")}
      aria-label="언어 전환 / Đổi ngôn ngữ"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        border: "1.5px solid var(--line)",
        background: "#fff",
        borderRadius: 999,
        padding: "7px 12px",
        fontSize: 11.5,
        fontWeight: 800,
        color: "var(--ink2)",
        cursor: "pointer",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {lang === "ko" ? "Tiếng Việt" : "한국어"}
    </button>
  );
}
