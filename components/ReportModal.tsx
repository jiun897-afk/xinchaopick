"use client";

import { useState } from "react";

const REASONS = ["욕설·비방", "부적절한 사진", "스팸·광고", "사기·외부 거래 유도", "노쇼·약속 불이행", "기타"];

export default function ReportModal({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (reason: string) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [etc, setEtc] = useState("");

  const reason = sel === "기타" ? etc.trim() : sel ?? "";

  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, zIndex: 970, background: "rgba(20,15,10,.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "22px 22px 0 0", padding: "20px 18px 26px" }}>
        <div style={{ fontSize: 16, fontWeight: 900, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ color: "#E0483E", display: "inline-flex" }}>
            <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          신고하기
        </div>
        <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 3 }}>사유를 선택해주세요. 운영팀이 확인 후 조치해요.</div>

        <div style={{ marginTop: 14 }}>
          {REASONS.map((r) => (
            <div
              key={r}
              onClick={() => setSel(r)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 12px",
                borderRadius: 12,
                cursor: "pointer",
                background: sel === r ? "var(--brand-bg)" : "transparent",
                border: sel === r ? "1.5px solid var(--brand)" : "1.5px solid transparent",
                marginTop: 4,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: sel === r ? "5.5px solid var(--brand)" : "2px solid var(--line)",
                  flexShrink: 0,
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 700 }}>{r}</span>
            </div>
          ))}
          {sel === "기타" && (
            <input
              autoFocus
              style={{ width: "100%", border: "1.5px solid var(--line)", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, fontFamily: "inherit", outline: "none", marginTop: 8 }}
              placeholder="사유를 간단히 적어주세요"
              value={etc}
              onChange={(e) => setEtc(e.target.value)}
              maxLength={100}
            />
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="btn ghost" style={{ flex: 1, padding: "13px 0" }} onClick={onCancel}>
            취소
          </button>
          <button
            className="btn pri"
            style={{ flex: 2, padding: "13px 0" }}
            disabled={!reason}
            onClick={() => reason && onSubmit(reason)}
          >
            신고 접수
          </button>
        </div>
      </div>
    </div>
  );
}
