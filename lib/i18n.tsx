"use client";

import { useEffect, useState } from "react";

export type Lang = "ko" | "vi";

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("ko");
  useEffect(() => {
    try {
      if (localStorage.getItem("bv_lang") === "vi") setLangState("vi");
    } catch {}
  }, []);
  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem("bv_lang", l);
    } catch {}
  }
  return [lang, setLang];
}

export function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <span style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 999, overflow: "hidden", fontSize: 11.5, fontWeight: 800 }}>
      {(["ko", "vi"] as Lang[]).map((l) => (
        <span
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "6px 11px",
            cursor: "pointer",
            background: lang === l ? "var(--ink)" : "#fff",
            color: lang === l ? "#fff" : "var(--ink2)",
          }}
        >
          {l === "ko" ? "한국어" : "Tiếng Việt"}
        </span>
      ))}
    </span>
  );
}

/* 페이지에서: const t = mkT(lang, VI);  t("한국어 문구") → 베트남어 */
export function mkT(lang: Lang, dict: Record<string, string>) {
  return (s: string) => (lang === "vi" ? dict[s] ?? s : s);
}
