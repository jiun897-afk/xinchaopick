"use client";

import { useState } from "react";

/* 프로필 사진 (없거나 로드 실패 시 이니셜) */
export default function Avatar({ url, name, size = 46 }: { url?: string | null; name?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken)
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", background: "var(--chip)", flexShrink: 0, display: "block" }}
      />
    );
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--brand)",
        color: "#fff",
        fontWeight: 900,
        fontSize: size * 0.38,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {(name ?? "?")[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
