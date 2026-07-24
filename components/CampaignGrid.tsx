"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
  "페이스북": "페북",
  "스레드": "스레드",
  "X(엑스)": "X",
  "영상": "영상",
};

const CHIPS = ["전체", "오늘 가능", "포인트", "기자단", "로컬맛집", "한식", "마사지·스파", "카페·디저트", "투어·액티비티", "네일·뷰티", "기타"];

function cardBadge(c: Campaign): string | null {
  if (c.quota > 0 && c.applied / c.quota >= 0.8) return "마감임박";
  if (c.created_at && Date.now() - new Date(c.created_at).getTime() < 7 * 86400000) return "NEW";
  return null;
}

function offerValue(c: Campaign): number {
  const nums = Array.from((c.offer ?? "").matchAll(/([\d,]+)\s*₫/g)).map((m) => Number(m[1].replace(/,/g, "")));
  return nums.length ? Math.max(...nums) : 0;
}

const SORTS = [
  { v: "default", l: "기본순" },
  { v: "value", l: "금액 높은순" },
  { v: "point", l: "포인트순" },
];

export default function CampaignGrid({ list }: { list: Campaign[] }) {
  const [sel, setSel] = useState("전체");
  const [sort, setSort] = useState("default");
  const [ch, setCh] = useState("전체");
  const [minP, setMinP] = useState(0);

  const filtered = useMemo(() => {
    let r = list;
    if (sel === "오늘 가능") r = r.filter((c) => c.today_available);
    else if (sel === "포인트") r = r.filter((c) => (c.reward_points ?? 0) > 0);
    else if (sel === "기자단") r = r.filter((c) => c.camp_type === "기자단");
    else if (sel !== "전체") r = r.filter((c) => c.category === sel);
    if (ch !== "전체") r = r.filter((c) => (MISSION_SHORT[c.mission_type] ?? c.mission_type) === ch);
    if (minP > 0) r = r.filter((c) => (c.reward_points ?? 0) >= minP);
    return r;
  }, [list, sel, ch, minP]);

  const sorted = useMemo(() => {
    if (sort === "value") return [...filtered].sort((a, b) => offerValue(b) - offerValue(a));
    if (sort === "point") return [...filtered].sort((a, b) => (b.reward_points ?? 0) - (a.reward_points ?? 0));
    return filtered;
  }, [filtered, sort]);

  return (
    <>
      <div className="chips">
        {CHIPS.map((ch) => (
          <span key={ch} className={"chip" + (sel === ch ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => setSel(ch)}>
            {ch}
          </span>
        ))}
      </div>

      <div className="chips" style={{ margin: "0 0 8px" }}>
        {["전체", "블로그", "유튜브", "쇼츠", "클립", "인스타", "릴스", "페북", "스레드", "X"].map((c2) => (
          <span key={c2} className={"chip" + (ch === c2 ? " on" : "")} style={{ cursor: "pointer", fontSize: 12, padding: "6px 12px" }} onClick={() => setCh(c2)}>
            {c2 === "전체" ? "채널 전체" : c2}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, margin: "2px 0 14px", flexWrap: "wrap" }}>
        {[
          { v: 0, l: "P 전체" },
          { v: 10000, l: "1만P↑" },
          { v: 30000, l: "3만P↑" },
          { v: 50000, l: "5만P↑" },
        ].map((o) => (
          <span
            key={o.v}
            onClick={() => setMinP(o.v)}
            style={{ fontSize: 12, fontWeight: 800, padding: "6px 12px", borderRadius: 20, cursor: "pointer", background: minP === o.v ? "var(--brand)" : "var(--chip)", color: minP === o.v ? "#fff" : "var(--ink2)" }}
          >
            {o.l}
          </span>
        ))}
        <span style={{ width: 1, background: "var(--line)", margin: "2px 2px" }} />
        {SORTS.map((s) => (
          <span
            key={s.v}
            onClick={() => setSort(s.v)}
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "6px 12px",
              borderRadius: 20,
              cursor: "pointer",
              background: sort === s.v ? "var(--ink)" : "var(--chip)",
              color: sort === s.v ? "#fff" : "var(--ink2)",
            }}
          >
            {s.l}
          </span>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13.5, color: "var(--ink3)" }}>
          이 조건의 캠페인이 아직 없어요. 다른 필터를 눌러보세요!
        </div>
      )}

      <div className="grid">
        {sorted.map((c) => (
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
