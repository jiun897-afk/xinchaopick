"use client";

import { useRouter } from "next/navigation";

const CHANNELS = [
  { key: "블로그", emoji: "✍️", c: "#1FA45B", bg: "#E8F7EF" },
  { key: "유튜브", emoji: "▶️", c: "#D93025", bg: "#FDECEC" },
  { key: "쇼츠", emoji: "🎬", c: "#D9420F", bg: "#FFE9DC" },
  { key: "클립", emoji: "🎞️", c: "#2E7D32", bg: "#E6F3E6" },
  { key: "인스타", emoji: "📸", c: "#7C3AED", bg: "#EEEAFF" },
  { key: "릴스", emoji: "🎥", c: "#C2185B", bg: "#FFE3F1" },
  { key: "페북", emoji: "👥", c: "#1A56DB", bg: "#E3F0FA" },
  { key: "스레드", emoji: "🧵", c: "#5C554D", bg: "#F0EDE0" },
  { key: "X", emoji: "✖️", c: "#26211C", bg: "#EDEDED" },
  { key: "기자단", emoji: "📰", c: "#8A6D1A", bg: "#FFF3D6" },
];

export default function ChannelIcons() {
  const router = useRouter();
  return (
    <div style={{ margin: "10px 0 4px" }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: "var(--ink3)", letterSpacing: 0.3, marginBottom: 8 }}>SNS 채널로 모아보기</div>
      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 }} className="regionrow">
        {CHANNELS.map((ch) => (
          <div
            key={ch.key}
            onClick={() => router.push("/channel?c=" + encodeURIComponent(ch.key))}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              background: ch.bg,
              borderRadius: 999,
              padding: "9px 14px 9px 11px",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 800,
              color: ch.c,
            }}
          >
            <span style={{ fontSize: 14 }}>{ch.emoji}</span>
            {ch.key}
          </div>
        ))}
      </div>
    </div>
  );
}
