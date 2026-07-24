"use client";
/* 베자뷰 한국어↔베트남어 전환
   - localStorage 'bv_lang' 저장값 우선
   - 저장값 없으면 폰 언어가 베트남어(vi)면 자동으로 베트남어 시작
   - 어디서 바꿔도 전 화면 즉시 동기화(bv-lang 이벤트) */

import { useEffect, useState } from "react";

export type Lang = "ko" | "vi";

export function getLang(): Lang {
  if (typeof window === "undefined") return "ko";
  try {
    const saved = localStorage.getItem("bv_lang");
    if (saved === "ko" || saved === "vi") return saved as Lang;
    return /^vi/i.test(navigator.language || "") ? "vi" : "ko";
  } catch {
    return "ko";
  }
}

export function setGlobalLang(l: Lang) {
  try {
    localStorage.setItem("bv_lang", l);
  } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event("bv-lang"));
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("ko"); // SSR 첫 렌더는 ko → 마운트 후 실제값
  useEffect(() => {
    setLangState(getLang());
    const h = () => setLangState(getLang());
    window.addEventListener("bv-lang", h);
    return () => window.removeEventListener("bv-lang", h);
  }, []);
  function setLang(l: Lang) {
    setLangState(l);
    setGlobalLang(l);
  }
  return [lang, setLang];
}

export function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <span style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 999, overflow: "hidden", fontSize: 11.5, fontWeight: 800 }}>
      {(["ko", "vi"] as Lang[]).map((l) => (
        <span
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "6px 11px",
            cursor: "pointer",
            background: lang === l ? "var(--ink)" : "#fff",
            color: lang === l ? "#fff" : "var(--ink2)",
          }}
        >
          {l === "ko" ? "한국어" : "Tiếng Việt"}
        </span>
      ))}
    </span>
  );
}

/* 페이지에서: const t = mkT(lang, VI);  t("한국어 문구") → 베트남어 */
export function mkT(lang: Lang, dict: Record<string, string>) {
  return (s: string) => (lang === "vi" ? dict[s] ?? s : s);
}

/* 지역명 (표시용 — 필터 값은 한국어 그대로 사용) */
export const VI_REGION: Record<string, string> = {
  다낭: "Đà Nẵng",
  나트랑: "Nha Trang",
  푸꾸옥: "Phú Quốc",
  호치민: "TP.HCM",
  하노이: "Hà Nội",
  달랏: "Đà Lạt",
  무이네: "Mũi Né",
  붕따우: "Vũng Tàu",
  하롱베이: "Hạ Long",
  사파: "Sa Pa",
  호이안: "Hội An",
};

/* 업종명 (표시용) */
export const VI_CAT: Record<string, string> = {
  로컬맛집: "Quán địa phương",
  한식: "Món Hàn",
  "마사지·스파": "Massage · Spa",
  "카페·디저트": "Cà phê · Bánh",
  "투어·액티비티": "Tour · Hoạt động",
  "네일·뷰티": "Nail · Làm đẹp",
  "사진·스냅": "Chụp ảnh",
  "숙소·풀빌라": "Khách sạn · Villa",
  기타: "Khác",
  "전체 보기": "Xem tất cả",
};

export const VI_CAT_SUB: Record<string, string> = {
  로컬맛집: "Phở · Bún chả · Hải sản",
  한식: "Nhà hàng Hàn · Thịt nướng",
  "마사지·스파": "Massage · Spa · Tóc",
  "카페·디저트": "Cà phê · Bakery · Tráng miệng",
  "투어·액티비티": "Tour · Golf · Hoạt động",
  "네일·뷰티": "Nail · Beauty · Chăm sóc da",
  "사진·스냅": "Ảnh snap · Cưới · Hồ sơ",
  "숙소·풀빌라": "Hotel · Pool villa · Resort",
  기타: "Các trải nghiệm khác",
  "전체 보기": "Xem tất cả ngành hàng",
};
