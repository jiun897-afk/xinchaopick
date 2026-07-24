"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Region = { name: string; q: string; emoji: string; bg: string };

const MAIN: Region[] = [
  { name: "다낭·호이안", q: "다낭", emoji: "🏖️", bg: "#FFE9DC" },
  { name: "나트랑", q: "나트랑", emoji: "🌊", bg: "#DFF1FF" },
  { name: "푸꾸옥", q: "푸꾸옥", emoji: "🏝️", bg: "#E2F6E9" },
  { name: "호치민", q: "호치민", emoji: "🏙️", bg: "#EEEAFF" },
  { name: "하노이", q: "하노이", emoji: "🛵", bg: "#FFE9EC" },
];

const MORE: Region[] = [
  { name: "달랏", q: "달랏", emoji: "⛰️", bg: "#E6F3E6" },
  { name: "무이네", q: "무이네", emoji: "🏜️", bg: "#FFF0DB" },
  { name: "붕따우", q: "붕따우", emoji: "⚓", bg: "#E3F0FA" },
  { name: "하롱베이", q: "하롱베이", emoji: "⛵", bg: "#E0F2F1" },
  { name: "사파", q: "사파", emoji: "🌾", bg: "#F0EDE0" },
];

function Circle({ r, onGo }: { r: Region; onGo: (q: string) => void }) {
  return (
    <div onClick={() => onGo(r.q)} style={{ textAlign: "center", width: 62, flexShrink: 0, cursor: "pointer" }}>
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
        }}
      >
        {r.emoji}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {r.name}
      </div>
    </div>
  );
}

export default function RegionRow() {
  const [more, setMore] = useState(false);
  const router = useRouter();
  const go = (q: string) => router.push("/search?q=" + encodeURIComponent(q));
  return (
    <div style={{ margin: "14px 0 4px" }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: "var(--ink3)", letterSpacing: 0.3, marginBottom: 8 }}>지역</div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }} className="regionrow">
        {MAIN.map((r) => (
          <Circle key={r.name} r={r} onGo={go} />
        ))}
        {more && MORE.map((r) => <Circle key={r.name} r={r} onGo={go} />)}
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
          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: "var(--ink2)" }}>{more ? "접기" : "더보기"}</div>
        </div>
      </div>
    </div>
  );
}
