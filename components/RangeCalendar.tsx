"use client";

import { useState } from "react";

/* 기간(또는 하루) 선택 달력 — 지도 날짜 필터용 */
function iso(y: number, m: number, d: number) {
  return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
}

export default function RangeCalendar({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const now = new Date();
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate());
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const [y, m] = ym;
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  function tap(d: number) {
    const v = iso(y, m, d);
    if (v < todayIso) return;
    if (!from || (from && to)) onChange(v, "");
    else if (v === from) onChange("", "");
    else if (v < from) onChange(v, "");
    else onChange(from, v);
  }

  const inRange = (v: string) => from && to && v >= from && v <= to;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span
          onClick={() => setYm(m === 0 ? [y - 1, 11] : [y, m - 1])}
          style={{ cursor: "pointer", padding: "4px 12px", fontWeight: 900, color: "var(--ink2)", fontSize: 16 }}
        >
          ‹
        </span>
        <span style={{ flex: 1, textAlign: "center", fontSize: 14.5, fontWeight: 900 }}>
          {y}년 {m + 1}월
        </span>
        <span
          onClick={() => setYm(m === 11 ? [y + 1, 0] : [y, m + 1])}
          style={{ cursor: "pointer", padding: "4px 12px", fontWeight: 900, color: "var(--ink2)", fontSize: 16 }}
        >
          ›
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
          <div key={w} style={{ fontSize: 10.5, fontWeight: 800, color: i === 0 ? "#E05B4B" : "var(--ink3)", padding: "3px 0" }}>
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={"e" + i} />;
          const v = iso(y, m, d);
          const past = v < todayIso;
          const isEdge = v === from || v === to;
          const mid = !isEdge && inRange(v);
          return (
            <div
              key={v}
              onClick={() => tap(d)}
              style={{
                padding: "7px 0",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: past ? "default" : "pointer",
                color: past ? "#D8D2C9" : isEdge ? "#fff" : mid ? "var(--brand-dark)" : "var(--ink)",
                background: isEdge ? "var(--brand)" : mid ? "var(--brand-bg)" : "transparent",
                borderRadius: isEdge ? 10 : mid ? 0 : 10,
                position: "relative",
              }}
            >
              {d}
              {v === todayIso && !isEdge && (
                <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "var(--brand)" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
