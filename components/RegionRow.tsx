"use client";

import { useState } from "react";

type Region = { name: string; emoji: string; bg: string; open?: boolean };

const MAIN: Region[] = [
  { name: "다낭·호이안", emoji: "🏖️", bg: "#FFE9DC", open: true },
  { name: "나트랑", emoji: "🌊", bg: "#DFF1FF" },
  { name: "푸꾸옥", emoji: "🏝️", bg: "#E2F6E9" },
  { name: "호치민", emoji: "🏙️", bg: "#EEEAFF" },
  { name: "하노이", emoji: "🛵", bg: "#FFE9EC" },
];

const MORE: Region[] = [
  { name: "달랏", emoji: "⛰️", bg: "#E6F3E6" },
  { name: "무이네", emoji: "🏜️", bg: "#FFF0DB" },
  { name: "붕따우", emoji: "⚓", bg: "#E3F0FA" },
  { name: "하롱베이", emoji: "⛵", bg: "#E0F2F1" },
  { name: "사파", emoji: "🌾", bg: "#F0EDE0" },
];

function Circle({ r }: { r: Region }) {
  return (
    <div style={{ textAlign: "center", width: 62, flexShrink: 0, opacity: r.open ? 1 : 0.5, position: "relative" }}>
      <div
        style={{
          width: 54,
          height: 54,
          margin: "0 auto",
          borderRadius: "50%",
          background: r.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          border: r.open ? "2px solid var(--brand)" : "2px solid transparent",
        }}
      >
        {r.emoji}
      </div>
      <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 800, color: r.open ? "var(--brand-dark)" : "var(--ink2)" }}>
        {r.name}
      </div>
      {!r.open && (
        <div style={{ fontSize: 8.5, fontWeight: 800, color: "var(--ink3)", marginTop: 1 }}>오픈 예정</div>
      )}
    </div>
  );
}

export default function RegionRow() {
  const [more, setMore] = useState(false);
  return (
    <div style={{ margin: "18px 0 4px" }}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }} className="regionrow">
        {MAIN.map((r) => (
          <Circle key={r.name} r={r} />
        ))}
        {more && MORE.map((r) => <Circle key={r.name} r={r} />)}
        <div style={{ textAlign: "center", width: 62, flexShrink: 0, cursor: "pointer" }} onClick={() => setMore((v) => !v)}>
          <div
            style={{
              width: 54,
              height: 54,
              margin: "0 auto",
              borderRadius: "50%",
              background: "var(--chip)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 900,
              color: "var(--ink2)",
            }}
          >
            {more ? "−" : "+"}
          </div>
          <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 800, color: "var(--ink2)" }}>{more ? "접기" : "더보기"}</div>
        </div>
      </div>
    </div>
  );
}
