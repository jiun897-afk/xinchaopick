"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MascotIcon from "./MascotIcon";

const CATS = [
  "로컬맛집",
  "한식",
  "마사지·스파",
  "카페·디저트",
  "투어·액티비티",
  "네일·뷰티",
  "사진·스냅",
  "숙소·풀빌라",
  "기타",
  "전체 보기",
];

export default function CategoryIcons() {
  const router = useRouter();
  const rowRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const check = () => setHint(el.scrollWidth > el.clientWidth + 8 && el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div
      className="selcard"
      style={{
        background: "linear-gradient(135deg, #FF7A45, #F04E1A)",
        border: "none",
        boxShadow: "0 6px 20px rgba(240,78,26,.25)",
      }}
    >
      <div className="sclabel" style={{ color: "rgba(255,255,255,.9)" }}>
        업종으로 찾기
      </div>
      <div style={{ position: "relative" }}>
        <div ref={rowRef} style={{ display: "flex", gap: 9, overflowX: "auto", paddingBottom: 4 }} className="regionrow">
          {CATS.map((key) => (
            <div
              key={key}
              className="cattile"
              onClick={() => router.push(key === "전체 보기" ? "/browse" : "/browse?cat=" + encodeURIComponent(key))}
            >
              <div className="cbox" style={{ background: "rgba(255,255,255,.95)", boxShadow: "0 2px 8px rgba(160,40,5,.18)" }}>
                <MascotIcon name={key} size={52} />
              </div>
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textShadow: "0 1px 3px rgba(160,40,5,.25)" }}>
                {key}
              </div>
            </div>
          ))}
        </div>
        {hint && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: -15,
              bottom: 0,
              width: 56,
              background: "linear-gradient(to left, #F04E1A 20%, rgba(240,78,26,0))",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 2,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(120,30,4,.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 900,
                color: "var(--brand-dark)",
              }}
            >
              ›
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
