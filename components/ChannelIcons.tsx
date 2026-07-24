"use client";

import { useRouter } from "next/navigation";

const CHANNELS = [
  { key: "블로그", emoji: "✍️", bg: "#E8F7EF" },
  { key: "유튜브", emoji: "▶️", bg: "#FFE9EC" },
  { key: "쇼츠", emoji: "🎬", bg: "#FFE9DC" },
  { key: "클립", emoji: "🎞️", bg: "#E6F3E6" },
  { key: "인스타", emoji: "📸", bg: "#EEEAFF" },
  { key: "릴스", emoji: "🎥", bg: "#FFE3F1" },
  { key: "페북", emoji: "👥", bg: "#E3F0FA" },
  { key: "스레드", emoji: "🧵", bg: "#F0EDE0" },
  { key: "X", emoji: "✖️", bg: "#EDEDED" },
  { key: "기자단", emoji: "📰", bg: "#FFF3D6" },
];

export default function ChannelIcons() {
  const router = useRouter();
  return (
    <div style={{ margin: "16px 0 4px" }}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }} className="regionrow">
        {CHANNELS.map((c) => (
          <div
            key={c.key}
            onClick={() => router.push("/channel?c=" + encodeURIComponent(c.key))}
            style={{ textAlign: "center", width: 62, flexShrink: 0, cursor: "pointer" }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                margin: "0 auto",
                borderRadius: "50%",
                background: c.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {c.emoji}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: "var(--ink2)", whiteSpace: "nowrap" }}>{c.key}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
