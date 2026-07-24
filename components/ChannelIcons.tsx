"use client";

import { useRouter } from "next/navigation";
import SnsLogo from "./SnsLogo";

const CHANNELS = ["블로그", "유튜브", "쇼츠", "클립", "인스타", "릴스", "페북", "스레드", "X", "기자단"];

export default function ChannelIcons() {
  const router = useRouter();
  return (
    <div className="selcard">
      <div className="sclabel">SNS 채널로 모아보기</div>
      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 }} className="regionrow">
        {CHANNELS.map((key) => (
          <div
            key={key}
            onClick={() => router.push("/channel?c=" + encodeURIComponent(key))}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              flexShrink: 0,
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "8px 14px 8px 9px",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 800,
              color: "var(--ink)",
            }}
          >
            <SnsLogo name={key} size={20} />
            {key}
          </div>
        ))}
      </div>
    </div>
  );
}
