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
  "유튜브 쇼츠": "쇼츠",
  "네이버 클립": "클립",
  "인스타그램": "인스타",
  "영상": "영상",
  "인스타 릴스": "릴스",
};

const CHIPS = ["전체", "오늘 가능", "포인트", "기자단", "로컬맛집", "한식", "마사지·스파", "카페·디저트", "투어·액티비티", "네일·뷰티", "기타"];

function cardBadge(c: Campaign): string | null {
  if (c.quota > 0 && c.applied / c.quota >= 0.8) return "마감임박";
  if (c.created_at && Date.now() - new Date(c.created_at).getTime() < 7 * 86400000) return "NEW";
  return null;
}

export default function CampaignGrid({ list }: { list: Campaign[] }) {
  const [sel, setSel] = useState("전체");

  const filtered = useMemo(() => {
    if (sel === "전체") return list;
    if (sel === "오늘 가능") return list.filter((c) => c.today_available);
    if (sel === "포인트") return list.filter((c) => (c.reward_points ?? 0) > 0);
    if (sel === "기자단") return list.filter((c) => c.camp_type === "기자단");
    return list.filter((c) => c.category === sel);
  }, [list, sel]);

  return (
    <>
      <div className="chips">
        {CHIPS.map((ch) => (
          <span key={ch} className={"chip" + (sel === ch ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => setSel(ch)}>
            {ch}
          </span>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13.5, color: "var(--ink3)" }}>
          이 조건의 캠페인이 아직 없어요. 다른 필터를 눌러보세요!
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
