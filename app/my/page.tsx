"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

type Row = {
  id: string;
  created_at: string;
  status: string;
  campaigns: {
    id: string;
    store_name: string;
    category: string;
    offer: string;
    mission_type: string;
    image_url: string | null;
  } | null;
};

const STATUS_LABEL: Record<string, { text: string; bg: string; color: string }> = {
  pending: { text: "선정 대기 중", bg: "#FFF4E0", color: "#8A6D1A" },
  selected: { text: "선정됨!", bg: "#E8F7EF", color: "#1FA45B" },
  rejected: { text: "미선정", bg: "#F5F2ED", color: "#9B948B" },
  cancelled: { text: "취소됨", bg: "#F5F2ED", color: "#9B948B" },
};

export default function MyPage() {
  const supabase = getSupabase();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setGuest(true);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setGuest(true);
        return;
      }
      const { data } = await supabase
        .from("applications")
        .select("id, created_at, status, campaigns(id, store_name, category, offer, mission_type, image_url)")
        .order("created_at", { ascending: false });
      setRows((data as unknown as Row[]) ?? []);
    })();
  }, [supabase]);

  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 26, paddingBottom: 70 }}>
      <Link href="/" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 홈으로
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 14 }}>내 신청 내역</h1>

      {guest && (
        <div style={{ marginTop: 24 }}>
          <div className="notice info" style={{ borderRadius: 12, padding: "14px 16px", background: "var(--chip)", fontSize: 14 }}>
            로그인하면 신청 내역을 볼 수 있어요.
          </div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            로그인하기
          </Link>
        </div>
      )}

      {!guest && rows === null && (
        <div style={{ marginTop: 24, fontSize: 14, color: "var(--ink3)" }}>불러오는 중…</div>
      )}

      {!guest && rows !== null && rows.length === 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14.5, color: "var(--ink2)", lineHeight: 1.7 }}>
            아직 신청한 캠페인이 없어요.
            <br />
            마음에 드는 체험을 찾아 첫 신청을 해보세요!
          </div>
          <Link className="btn pri" style={{ marginTop: 16, padding: "13px 26px" }} href="/">
            체험단 둘러보기
          </Link>
        </div>
      )}

      {!guest &&
        rows !== null &&
        rows.map((r) => {
          const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
          const c = r.campaigns;
          return (
            <Link
              key={r.id}
              href={c ? "/campaign?id=" + c.id : "#"}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: "14px 16px",
                marginTop: 14,
              }}
            >
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 14,
                  backgroundColor: "var(--chip)",
                  backgroundImage: c?.image_url ? "url(" + c.image_url + ")" : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--brand-dark)" }}>
                  {c?.category ?? ""}
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 800, marginTop: 2 }}>
                  {c?.store_name ?? "(캠페인 정보 없음)"}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--ink2)",
                    marginTop: 3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c?.offer ?? ""}
                </div>
              </div>
              <span
                style={{
                  background: s.bg,
                  color: s.color,
                  fontSize: 11.5,
                  fontWeight: 800,
                  borderRadius: 9,
                  padding: "5px 11px",
                  flexShrink: 0,
                }}
              >
                {s.text}
              </span>
            </Link>
          );
        })}
    </div>
  );
}
