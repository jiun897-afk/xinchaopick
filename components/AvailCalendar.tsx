"use client";

import { useState } from "react";

/* 방문 가능 날짜 캘린더 — readOnly(보기) / 편집(onToggle) 겸용 */
export default function AvailCalendar({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle?: (iso: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [ym, setYm] = useState<[number, number]>([today.getFullYear(), today.getMonth()]);
  const [y, m] = ym;
  const sel = new Set(selected);
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const iso = (d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const editable = !!onToggle;

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "12px 12px 14px", background: "#fff", maxWidth: 360 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <button
          onClick={() => setYm(m === 0 ? [y - 1, 11] : [y, m - 1])}
          style={{ border: "none", background: "var(--chip)", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontWeight: 900, fontSize: 13 }}
          type="button"
        >
          ‹
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 900 }}>
          {y}년 {m + 1}월
        </div>
        <button
          onClick={() => setYm(m === 11 ? [y + 1, 0] : [y, m + 1])}
          style={{ border: "none", background: "var(--chip)", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontWeight: 900, fontSize: 13 }}
          type="button"
        >
          ›
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={d} style={{ fontSize: 10.5, fontWeight: 800, color: i === 0 ? "#E05252" : i === 6 ? "#3B82F6" : "var(--ink3)", padding: "3px 0" }}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={"e" + i} />;
          const dateIso = iso(d);
          const date = new Date(y, m, d);
          const past = date < today;
          const isSel = sel.has(dateIso);
          const isToday = date.getTime() === today.getTime();
          return (
            <div
              key={dateIso}
              onClick={() => {
                if (editable && !past) onToggle!(dateIso);
              }}
              style={{
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: editable && !past ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12.5,
                  fontWeight: isSel ? 900 : 600,
                  background: isSel && !past ? "var(--brand)" : "transparent",
                  color: past ? "#D8D2C9" : isSel ? "#fff" : "var(--ink2)",
                  border: isToday && !isSel ? "1.5px solid var(--brand)" : "none",
                }}
              >
                {d}
              </span>
            </div>
          );
        })}
      </div>
      {!editable && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 10.5, color: "var(--ink3)", fontWeight: 700 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--brand)", display: "inline-block" }} />
          방문 가능한 날
        </div>
      )}
    </div>
  );
}
