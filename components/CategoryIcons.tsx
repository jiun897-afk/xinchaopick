"use client";

import { useRouter } from "next/navigation";
import MascotIcon from "./MascotIcon";

const CATS = [
  { key: "로컬맛집", emoji: "🍜", bg: "#FFE9DC" },
  { key: "한식", emoji: "🥘", bg: "#FFF3D6" },
  { key: "마사지·스파", emoji: "💆", bg: "#E8F7EF" },
  { key: "카페·디저트", emoji: "☕", bg: "#F0EDE0" },
  { key: "투어·액티비티", emoji: "🏖️", bg: "#DFF1FF" },
  { key: "네일·뷰티", emoji: "💅", bg: "#FFE3F1" },
  { key: "사진·스냅", emoji: "📷", bg: "#EEEAFF" },
  { key: "숙소·풀빌라", emoji: "🏨", bg: "#E3F0FA" },
  { key: "기타", emoji: "✨", bg: "#EDEDED" },
  { key: "전체 보기", emoji: "🧡", bg: "var(--brand-bg)" },
];

export default function CategoryIcons() {
  const router = useRouter();
  return (
    <div className="selcard">
      <div className="sclabel">업종으로 찾기</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px 4px", paddingBottom: 4 }}>
        {CATS.map((c) => (
          <div
            key={c.key}
            onClick={() => router.push(c.key === "전체 보기" ? "/browse" : "/browse?cat=" + encodeURIComponent(c.key))}
            style={{ textAlign: "center", cursor: "pointer" }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                margin: "0 auto",
                borderRadius: 14,
                background: c.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MascotIcon name={c.key} size={40} />
            </div>
            <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 800, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.key}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
