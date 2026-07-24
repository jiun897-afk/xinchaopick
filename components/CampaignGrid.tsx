"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MascotIcon from "./MascotIcon";
import SnsLogo from "./SnsLogo";

const CH_ROW = ["전체", "블로그", "인스타", "유튜브", "쇼츠", "릴스", "클립", "틱톡", "페북", "스레드", "X"];

type Campaign = {
  id: string;
  store_name: string;
  category: string;
  offer: string;
  mission_type: string;
  quota: number;
  applied: number;
  area: string | null;
  image_url: string | null;
  reward_points?: number | null;
  party_size?: number | null;
  created_at?: string | null;
  today_available?: boolean | null;
  camp_type?: string | null;
};

const MISSION_SHORT: Record<string, string> = {
  "네이버 블로그": "블로그",
  "네이버 클립": "클립",
  "유튜브 롱폼": "유튜브",
  "유튜브 쇼츠": "쇼츠",
  "인스타그램": "인스타",
  "인스타 릴스": "릴스",
  "틱톡": "틱톡",
  "페이스북": "페북",
  "스레드": "스레드",
  "X(엑스)": "X",
  "영상": "영상",
};

const CATS = [
  { key: "전체", emoji: "🧡", bg: "var(--brand-bg)" },
  { key: "로컬맛집", emoji: "🍜", bg: "#FFE9DC" },
  { key: "한식", emoji: "🥘", bg: "#FFF3D6" },
  { key: "마사지·스파", emoji: "💆", bg: "#E8F7EF" },
  { key: "카페·디저트", emoji: "☕", bg: "#F0EDE0" },
  { key: "투어·액티비티", emoji: "🏖️", bg: "#DFF1FF" },
  { key: "네일·뷰티", emoji: "💅", bg: "#FFE3F1" },
  { key: "사진·스냅", emoji: "📷", bg: "#EEEAFF" },
  { key: "숙소·풀빌라", emoji: "🏨", bg: "#E3F0FA" },
  { key: "기타", emoji: "✨", bg: "#EDEDED" },
];

const REGIONS = [
  { key: "전체", emoji: "🌏", bg: "var(--chip)" },
  { key: "다낭", emoji: "🏖️", bg: "#FFE9DC" },
  { key: "나트랑", emoji: "🌊", bg: "#DFF1FF" },
  { key: "푸꾸옥", emoji: "🏝️", bg: "#E2F6E9" },
  { key: "호치민", emoji: "🏙️", bg: "#EEEAFF" },
  { key: "하노이", emoji: "🛵", bg: "#FFE9EC" },
  { key: "달랏", emoji: "⛰️", bg: "#E6F3E6" },
  { key: "무이네", emoji: "🏜️", bg: "#FFF0DB" },
];

const DANANG_SUB = new Set(["다낭", "미케비치", "안탕", "시내", "한시장", "호이안"]);

function offerValue(c: Campaign): number {
  const nums = Array.from((c.offer ?? "").matchAll(/([\d,]+)\s*₫/g)).map((m) => Number(m[1].replace(/,/g, "")));
  return nums.length ? Math.max(...nums) : 0;
}

function cardBadge(c: Campaign): string | null {
  if (c.quota > 0 && c.applied / c.quota >= 0.8) return "마감임박";
  if (c.created_at && Date.now() - new Date(c.created_at).getTime() < 7 * 86400000) return "NEW";
  return null;
}

function IconRow({
  items,
  sel,
  onSel,
  label,
  shape = "circle",
}: {
  items: { key: string; emoji: string; bg: string }[];
  sel: string;
  onSel: (k: string) => void;
  label?: string;
  shape?: "circle" | "square";
}) {
  const sq = shape === "square";
  const size = sq ? 46 : 54;
  return (
    <div>
      {label && <div className="sclabel">{label}</div>}
      <div style={{ display: "flex", gap: sq ? 8 : 6, overflowX: "auto", paddingBottom: 4 }} className="regionrow">
        {items.map((it) => {
          const on = sel === it.key;
          return (
            <div key={it.key} onClick={() => onSel(it.key)} style={{ textAlign: "center", width: sq ? 56 : 62, flexShrink: 0, cursor: "pointer" }}>
              <div
                style={{
                  width: size,
                  height: size,
                  margin: "0 auto",
                  borderRadius: sq ? 14 : "50%",
                  background: it.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: on ? "2.5px solid var(--brand)" : "2.5px solid transparent",
                  boxShadow: sq && on ? "0 4px 12px rgba(240,78,26,.25)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <MascotIcon name={it.key} size={sq ? 38 : 44} />
              </div>
              <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 800, color: on ? "var(--brand-dark)" : "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.key}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CampaignGrid({
  list,
  hideChannelRow = false,
  showRegions = false,
  initialCampType = "",
  initialCat = "전체",
}: {
  list: Campaign[];
  hideChannelRow?: boolean;
  showRegions?: boolean;
  initialCampType?: "" | "체험단" | "기자단";
  initialCat?: string;
}) {
  const [campType, setCampType] = useState<"" | "체험단" | "기자단">(initialCampType);
  const [cat, setCat] = useState(initialCat);
  const [chs, setChs] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState("전체");
  const [sort, setSort] = useState("default");
  const [minP, setMinP] = useState(0);
  const [todayOnly, setTodayOnly] = useState(false);

  const filtered = useMemo(() => {
    let r = list;
    if (campType === "기자단") r = r.filter((c) => c.camp_type === "기자단");
    else if (campType === "체험단") r = r.filter((c) => c.camp_type !== "기자단");
    if (cat !== "전체") r = r.filter((c) => c.category === cat);
    if (chs.size > 0) r = r.filter((c) => chs.has(MISSION_SHORT[c.mission_type] ?? c.mission_type));
    if (todayOnly) r = r.filter((c) => c.today_available);
    if (minP > 0) r = r.filter((c) => (c.reward_points ?? 0) >= minP);
    if (showRegions && region !== "전체") {
      r = r.filter((c) => (region === "다낭" ? DANANG_SUB.has(c.area ?? "") : c.area === region));
    }
    if (sort === "value") r = [...r].sort((a, b) => offerValue(b) - offerValue(a));
    else if (sort === "point") r = [...r].sort((a, b) => (b.reward_points ?? 0) - (a.reward_points ?? 0));
    return r;
  }, [list, campType, cat, chs, region, sort, minP, todayOnly, showRegions]);

  const filterActive =
    campType !== initialCampType || cat !== initialCat || chs.size > 0 || region !== "전체" || todayOnly || minP > 0 || sort !== "default";

  function resetAll() {
    setCampType(initialCampType);
    setCat(initialCat);
    setChs(new Set());
    setRegion("전체");
    setTodayOnly(false);
    setMinP(0);
    setSort("default");
  }

  const selStyle: React.CSSProperties = {
    border: "1px solid var(--line)",
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "inherit",
    background: "#fff",
    color: "var(--ink2)",
    outline: "none",
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {(["체험단", "기자단"] as const).map((t) => {
          const on = campType === t;
          const press = t === "기자단";
          return (
            <div
              key={t}
              onClick={() => setCampType(on ? "" : t)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: on ? (press ? "#6D28D9" : "var(--brand)") : "#fff",
                color: on ? "#fff" : "var(--ink)",
                border: on ? "1px solid transparent" : "1px solid var(--line)",
                borderRadius: 16,
                padding: "15px 0",
                fontSize: 15.5,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: on
                  ? press
                    ? "0 4px 14px rgba(109,40,217,.3)"
                    : "0 4px 14px rgba(240,78,26,.3)"
                  : "0 2px 12px rgba(38,33,28,.04)",
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 19 }}>{press ? "📰" : "🧡"}</span>
              {t}
              <span style={{ fontSize: 11, fontWeight: 700, opacity: on ? 0.85 : 0.45 }}>
                {press ? "원고형 리뷰" : "방문 체험"}
              </span>
            </div>
          );
        })}
      </div>
      {showRegions && (
        <div className="selcard">
          <IconRow items={REGIONS} sel={region} onSel={setRegion} label="지역" />
        </div>
      )}
      {!hideChannelRow && (
        <div className="selcard">
          <div className="sclabel">SNS 채널 <span style={{ fontWeight: 700, opacity: 0.7 }}>· 여러 개 선택 가능</span></div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 }} className="regionrow">
            {CH_ROW.map((k) => {
              const on = k === "전체" ? chs.size === 0 : chs.has(k);
              const toggle = () => {
                if (k === "전체") setChs(new Set());
                else
                  setChs((prev) => {
                    const next = new Set(prev);
                    if (next.has(k)) next.delete(k);
                    else next.add(k);
                    return next;
                  });
              };
              return (
                <div key={k} onClick={toggle} style={{ textAlign: "center", width: 52, flexShrink: 0, cursor: "pointer" }}>
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
                      border: on ? "2.5px solid var(--brand)" : "2.5px solid transparent",
                      boxShadow: on ? "0 4px 12px rgba(240,78,26,.18)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {k === "전체" ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-dark)" strokeWidth="2.4" strokeLinecap="round">
                        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
                        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
                        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
                        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
                      </svg>
                    ) : (
                      <SnsLogo name={k} size={26} />
                    )}
                  </div>
                  <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 800, color: on ? "var(--brand-dark)" : "var(--ink2)", whiteSpace: "nowrap" }}>
                    {k}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="selcard">
        <IconRow items={CATS} sel={cat} onSel={setCat} label="업종" shape="square" />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0 0" }}>
        <span
          onClick={() => setTodayOnly((v) => !v)}
          style={{
            fontSize: 12,
            fontWeight: 800,
            padding: "7px 13px",
            borderRadius: 999,
            cursor: "pointer",
            background: todayOnly ? "var(--brand)" : "#fff",
            color: todayOnly ? "#fff" : "var(--ink2)",
            border: todayOnly ? "1px solid var(--brand)" : "1px solid var(--line)",
          }}
        >
          오늘 가능
        </span>
        {filterActive && (
          <span
            onClick={resetAll}
            style={{ fontSize: 12, fontWeight: 800, padding: "7px 13px", borderRadius: 999, cursor: "pointer", background: "#fff", color: "var(--ink3)", border: "1px solid var(--line)" }}
          >
            ↺ 초기화
          </span>
        )}
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <select style={selStyle} value={minP} onChange={(e) => setMinP(Number(e.target.value))}>
            <option value={0}>포인트 전체</option>
            <option value={10000}>1만P 이상</option>
            <option value={30000}>3만P 이상</option>
            <option value={50000}>5만P 이상</option>
          </select>
          <select style={selStyle} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">기본순</option>
            <option value="value">금액 높은순</option>
            <option value="point">포인트순</option>
          </select>
        </span>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, fontWeight: 800, color: "var(--ink3)" }}>
        {campType || "전체"} {chs.size > 0 ? "· " + Array.from(chs).join("·") : ""} {cat !== "전체" ? "· " + cat : ""} — <b style={{ color: "var(--brand-dark)" }}>{filtered.length}개</b> 캠페인
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13.5, color: "var(--ink3)" }}>
          이 조건의 캠페인이 아직 없어요. 다른 조건을 눌러보세요!
        </div>
      )}

      <div className="grid">
        {filtered.map((c) => (
          <Link className="gcard" key={c.id} href={"/campaign?id=" + c.id} style={{ display: "block" }}>
            <div className="gthumb" style={c.image_url ? { backgroundImage: "url(" + c.image_url + ")" } : undefined}>
              {cardBadge(c) ? <span className="gbadge hot">{cardBadge(c)}</span> : null}
              {(c.reward_points ?? 0) > 0 && (
                <span className="gbadge" style={{ left: "auto", right: 12, background: "rgba(20,15,10,.78)" }}>
                  +{Number(c.reward_points).toLocaleString()}P
                </span>
              )}
              <span className="gbadge" style={{ top: "auto", bottom: 12, background: "rgba(20,15,10,.66)" }}>
                {c.applied}/{c.quota}팀
              </span>
            </div>
            <div className="ginfo">
              <div className="gcat">
                <span
                  style={{
                    background: c.camp_type === "기자단" ? "#EEEAFF" : "var(--brand-bg)",
                    color: c.camp_type === "기자단" ? "#6D28D9" : "var(--brand-dark)",
                    borderRadius: 5,
                    padding: "1px 6px",
                    marginRight: 5,
                    fontSize: 10,
                  }}
                >
                  {c.camp_type === "기자단" ? "기자단" : "체험단"}
                </span>
                {c.category}
              </div>
              <div className="gname">{c.store_name}</div>
              <div className="goffer">
                {c.offer.split("·").map((part, i) => {
                  const p = part.trim();
                  const hot = /무료|한도|만동|원|₫|상당/.test(p);
                  return (
                    <span key={i} style={hot ? { color: "var(--brand-dark)", fontWeight: 800 } : undefined}>
                      {i > 0 ? " · " : ""}
                      {p}
                    </span>
                  );
                })}
              </div>
              <div className="gmeta">
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.area ?? "다낭"} · 1팀 {c.party_size ?? 2}인
                </span>
                <span className="gpoint">{MISSION_SHORT[c.mission_type] ?? c.mission_type}</span>
                {c.today_available && <span className="gpoint" style={{ marginLeft: 0, background: "#E8F7EF", color: "#1FA45B" }}>오늘</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
