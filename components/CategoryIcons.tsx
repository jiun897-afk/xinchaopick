"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MascotIcon from "./MascotIcon";

const CATS: { key: string; sub: string; bg: string }[] = [
  { key: "로컬맛집", sub: "쌀국수 · 분짜 · 해산물", bg: "#FFF1E8" },
  { key: "한식", sub: "한식당 · 고기집 · 분식", bg: "#FFF7E2" },
  { key: "마사지·스파", sub: "마사지 · 스파 · 헤어", bg: "#EAF8F0" },
  { key: "카페·디저트", sub: "카페 · 베이커리 · 디저트", bg: "#F5F1E6" },
  { key: "투어·액티비티", sub: "투어 · 골프 · 액티비티", bg: "#E9F4FD" },
  { key: "네일·뷰티", sub: "네일 · 뷰티 · 피부관리", bg: "#FDEEF6" },
  { key: "사진·스냅", sub: "스냅사진 · 웨딩 · 프로필", bg: "#F1EEFD" },
  { key: "숙소·풀빌라", sub: "호텔 · 풀빌라 · 리조트", bg: "#EAF2FB" },
  { key: "기타", sub: "그 외 모든 체험", bg: "#F2F2F0" },
  { key: "전체 보기", sub: "전 업종 한 번에 보기", bg: "#FFF1E8" },
];

export default function CategoryIcons() {
  const router = useRouter();
  const [openAll, setOpenAll] = useState(false);
  return (
    <div
      className="selcard"
      style={{
        background: "linear-gradient(135deg, #FF7A45, #F04E1A)",
        border: "none",
        boxShadow: "0 6px 20px rgba(240,78,26,.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 9 }}>
        <div className="sclabel" style={{ color: "rgba(255,255,255,.9)", marginBottom: 0 }}>
          업종으로 찾기
        </div>
        <span
          onClick={() => setOpenAll((v) => !v)}
          style={{
            marginLeft: "auto",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(255,255,255,.95)",
            color: "var(--brand-dark)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(120,30,4,.25)",
            lineHeight: 1,
          }}
        >
          {openAll ? "−" : "+"}
        </span>
      </div>
      {openAll ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, paddingBottom: 4 }}>
          {CATS.map((c) => (
            <div
              key={c.key}
              onClick={() => router.push(c.key === "전체 보기" ? "/browse" : "/browse?cat=" + encodeURIComponent(c.key))}
              style={{
                background: c.bg,
                borderRadius: 14,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 9,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(140,35,5,.12)",
              }}
            >
              <MascotIcon name={c.key} size={40} />
              <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.key}
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div
        style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollSnapType: "x mandatory" }}
        className="regionrow"
      >
        {CATS.map((c) => (
          <div
            key={c.key}
            onClick={() => router.push(c.key === "전체 보기" ? "/browse" : "/browse?cat=" + encodeURIComponent(c.key))}
            style={{
              flex: "0 0 82%",
              maxWidth: 340,
              scrollSnapAlign: "start",
              background: c.bg,
              borderRadius: 18,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(140,35,5,.15)",
            }}
          >
            <div
              style={{
                width: 86,
                height: 86,
                flexShrink: 0,
                borderRadius: 22,
                background: "rgba(255,255,255,.75)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MascotIcon name={c.key} size={72} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17.5, fontWeight: 900, color: "var(--ink)" }}>{c.key}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.sub}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--brand-dark)", marginTop: 8 }}>
                캠페인 보기 →
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
