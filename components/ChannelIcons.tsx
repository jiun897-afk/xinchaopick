"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SnsLogo from "./SnsLogo";

const CHANNELS = ["블로그", "인스타", "유튜브", "쇼츠", "릴스", "클립", "틱톡", "페북", "스레드", "X"];

export default function ChannelIcons() {
  const router = useRouter();
  const [more, setMore] = useState(false);
  const shown = more ? CHANNELS : CHANNELS.slice(0, 7);
  return (
    <div className="selcard">
      <div className="sclabel">SNS 채널로 모아보기</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px 4px", paddingBottom: 4 }}>
        {shown.map((key) => (
          <div
            key={key}
            onClick={() => router.push("/channel?c=" + encodeURIComponent(key))}
            style={{ textAlign: "center", cursor: "pointer" }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                margin: "0 auto",
                borderRadius: 14,
                background: "#F7F5F1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SnsLogo name={key} size={26} />
            </div>
            <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 800, color: "var(--ink2)", whiteSpace: "nowrap" }}>{key}</div>
          </div>
        ))}
        <div onClick={() => setMore((v) => !v)} style={{ textAlign: "center", cursor: "pointer" }}>
          <div
            style={{
              width: 46,
              height: 46,
              margin: "0 auto",
              borderRadius: 14,
              background: "var(--chip)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 900,
              color: "var(--ink2)",
            }}
          >
            {more ? "−" : "+"}
          </div>
          <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 800, color: "var(--ink2)" }}>{more ? "접기" : "더보기"}</div>
        </div>
      </div>
    </div>
  );
}
