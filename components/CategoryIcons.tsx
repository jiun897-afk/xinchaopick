"use client";

import { useRouter } from "next/navigation";
import MascotIcon from "./MascotIcon";

const CATS = [
  { key: "로컬맛집", bg: "#FFE9DC" },
  { key: "한식", bg: "#FFF3D6" },
  { key: "마사지·스파", bg: "#E8F7EF" },
  { key: "카페·디저트", bg: "#F0EDE0" },
  { key: "투어·액티비티", bg: "#DFF1FF" },
  { key: "네일·뷰티", bg: "#FFE3F1" },
  { key: "사진·스냅", bg: "#EEEAFF" },
  { key: "숙소·풀빌라", bg: "#E3F0FA" },
  { key: "기타", bg: "#EDEDED" },
  { key: "전체 보기", bg: "var(--brand-bg)" },
];

export default function CategoryIcons() {
  const router = useRouter();
  return (
    <div className="selcard">
      <div className="sclabel">업종으로 찾기</div>
      <div style={{ display: "flex", gap: 9, overflowX: "auto", paddingBottom: 4 }} className="regionrow">
        {CATS.map((c) => (
          <div
            key={c.key}
            onClick={() => router.push(c.key === "전체 보기" ? "/browse" : "/browse?cat=" + encodeURIComponent(c.key))}
            style={{ textAlign: "center", width: 72, flexShrink: 0, cursor: "pointer" }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                margin: "0 auto",
                borderRadius: 20,
                background: c.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MascotIcon name={c.key} size={56} />
            </div>
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.key}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
