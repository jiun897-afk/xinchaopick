"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SCOPES = [
  { v: "all", t: "전체" },
  { v: "campaign", t: "체험단" },
  { v: "place", t: "업체" },
  { v: "community", t: "커뮤니티" },
];

const HOT = ["마사지", "한식", "스냅사진", "네일", "호이안 투어", "풀빌라"];

export default function HomeSearch() {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("all");
  const router = useRouter();

  function go(term?: string) {
    const query = (term ?? q).trim();
    if (scope === "community") {
      router.push("/community");
      return;
    }
    if (query) router.push("/search?q=" + encodeURIComponent(query) + "&scope=" + scope);
  }

  return (
    <div className="hsearch" style={{ maxWidth: 560, marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1.5px solid var(--line)",
          borderRadius: 999,
          background: "#fff",
          boxShadow: "0 2px 12px rgba(38,33,28,.05)",
          overflow: "hidden",
        }}
      >
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            background: "var(--chip)",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 800,
            padding: "14px 10px 14px 16px",
            cursor: "pointer",
            color: "var(--ink)",
            flexShrink: 0,
          }}
        >
          {SCOPES.map((s) => (
            <option key={s.v} value={s.v}>
              {s.t}
            </option>
          ))}
        </select>
        <input
          style={{ flex: 1, border: "none", outline: "none", padding: "14px 12px", fontSize: 14.5, fontFamily: "inherit", minWidth: 0 }}
          placeholder="맛집, 마사지, 업체 이름 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />
        <button
          onClick={() => go()}
          aria-label="검색"
          style={{
            border: "none",
            cursor: "pointer",
            background: "var(--brand)",
            width: 40,
            height: 40,
            borderRadius: "50%",
            margin: 5,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </button>
      </div>
      <div className="hotrow" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink3)" }}>인기 검색어</span>
        {HOT.map((h) => (
          <span
            key={h}
            onClick={() => {
              setQ(h);
              go(h);
            }}
            style={{ fontSize: 12, fontWeight: 700, color: "var(--ink2)", background: "#fff", border: "1px solid var(--line)", borderRadius: 999, padding: "4px 11px", cursor: "pointer" }}
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}
