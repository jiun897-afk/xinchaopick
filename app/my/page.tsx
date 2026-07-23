"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

type Row = {
  id: string;
  created_at: string;
  status: string;
  review_url: string | null;
  review_submitted_at: string | null;
  review_approved_at: string | null;
  dispute_status: string | null;
  dispute_reason: string | null;
  campaigns: {
    id: string;
    store_name: string;
    category: string;
    offer: string;
    mission_type: string;
    image_url: string | null;
    reward_points: number | null;
  } | null;
};

const STATUS_LABEL: Record<string, { text: string; bg: string; color: string }> = {
  pending: { text: "선정 대기 중", bg: "#FFF4E0", color: "#8A6D1A" },
  selected: { text: "선정됨!", bg: "#E8F7EF", color: "#1FA45B" },
  rejected: { text: "미선정", bg: "#F5F2ED", color: "#9B948B" },
  cancelled: { text: "취소됨", bg: "#F5F2ED", color: "#9B948B" },
  completed: { text: "완료", bg: "#E8F0FE", color: "#1A56DB" },
};

export default function MyPage() {
  const supabase = getSupabase();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [guest, setGuest] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function load() {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setGuest(true);
      return;
    }
    const [{ data }, { data: w }] = await Promise.all([
      supabase
        .from("applications")
        .select("id, created_at, status, review_url, review_submitted_at, review_approved_at, dispute_status, dispute_reason, campaigns(id, store_name, category, offer, mission_type, image_url, reward_points)")
        .order("created_at", { ascending: false }),
      supabase.from("wallets").select("balance").maybeSingle(),
    ]);
    setRows((data as unknown as Row[]) ?? []);
    setBalance((w as any)?.balance ?? 0);
  }

  useEffect(() => {
    if (!supabase) {
      setGuest(true);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function submitReview(appId: string) {
    if (!supabase) return;
    setErr("");
    const url = (urls[appId] ?? "").trim();
    if (!/^https?:\/\//i.test(url)) return setErr("발행한 리뷰 링크를 https:// 부터 입력해주세요.");
    setBusy(appId);
    const { error } = await supabase.rpc("submit_review", { p_app_id: appId, p_url: url });
    setBusy(null);
    if (error) return setErr(error.message);
    load();
  }

  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 26, paddingBottom: 90 }}>
      <Link href="/" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 홈으로
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 14 }}>내 신청 내역</h1>

      {!guest && balance !== null && (
        <Link
          href="/wallet"
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 14,
            borderRadius: 14,
            padding: "14px 18px",
            background: "linear-gradient(115deg,#FF7A45,#F04E1A)",
            color: "#fff",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800 }}>내 포인트</span>
          <b style={{ marginLeft: 10, fontSize: 17 }}>{balance.toLocaleString()}P</b>
          <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 800 }}>출금하기 ›</span>
        </Link>
      )}

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

      {!guest && rows === null && <div style={{ marginTop: 24, fontSize: 14, color: "var(--ink3)" }}>불러오는 중…</div>}

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

      {err && <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: "#C0392B" }}>{err}</div>}

      {!guest &&
        rows !== null &&
        rows.map((r) => {
          const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
          const c = r.campaigns;
          const reward = c?.reward_points ?? 0;
          return (
            <div key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 16, marginTop: 14, overflow: "hidden" }}>
              <Link
                href={c ? "/campaign?id=" + c.id : "#"}
                style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 16px" }}
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
                    {reward > 0 && <span style={{ marginLeft: 8 }}>+{reward.toLocaleString()}P 지급</span>}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, marginTop: 2 }}>{c?.store_name ?? "(캠페인 정보 없음)"}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink2)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c?.offer ?? ""}
                  </div>
                </div>
                <span style={{ background: s.bg, color: s.color, fontSize: 11.5, fontWeight: 800, borderRadius: 9, padding: "5px 11px", flexShrink: 0 }}>
                  {s.text}
                </span>
              </Link>

              {r.status === "selected" && !r.review_url && (
                <div style={{ borderTop: "1px solid var(--line)", padding: "12px 16px", background: "#FBFAF8" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>
                    체험 후 발행한 리뷰 링크를 제출해주세요 ({c?.mission_type})
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}
                      placeholder="https://blog.naver.com/..."
                      value={urls[r.id] ?? ""}
                      onChange={(e) => setUrls((m) => ({ ...m, [r.id]: e.target.value }))}
                    />
                    <button className="btn pri" style={{ padding: "10px 16px", fontSize: 13, flexShrink: 0 }} onClick={() => submitReview(r.id)} disabled={busy === r.id}>
                      {busy === r.id ? "제출 중…" : "제출"}
                    </button>
                  </div>
                </div>
              )}

              {r.review_url && !r.review_approved_at && r.dispute_status === "issue" && (
                <div style={{ borderTop: "1px solid var(--line)", padding: "12px 16px", background: "#FDF3F2", fontSize: 12.5, lineHeight: 1.7 }}>
                  <b style={{ color: "#C0392B" }}>사장님이 문제를 제기했어요</b>
                  <div style={{ color: "var(--ink2)", marginTop: 3 }}>사유: {r.dispute_reason}</div>
                  <div style={{ color: "var(--ink3)", fontSize: 11.5, marginTop: 4 }}>
                    자동 확정이 잠시 멈췄어요. 리뷰를 보완하거나 카카오톡 채널 @베자뷰로 협의해주세요. 협의가 어려우면
                    운영팀 중재를 신청할 수 있어요.
                  </div>
                </div>
              )}
              {r.review_url && !r.review_approved_at && r.dispute_status === "dispute" && (
                <div style={{ borderTop: "1px solid var(--line)", padding: "11px 16px", background: "#FBFAF8", fontSize: 12.5, fontWeight: 700, color: "var(--ink2)" }}>
                  운영팀이 중재 중이에요 — 결과가 나오면 알려드릴게요
                </div>
              )}
              {r.review_url && !r.review_approved_at && !r.dispute_status && (
                <div style={{ borderTop: "1px solid var(--line)", padding: "11px 16px", background: "#FBFAF8", fontSize: 12.5, fontWeight: 700, color: "#8A6D1A" }}>
                  리뷰 제출됨 — 사장님 확인 중
                  {r.review_submitted_at &&
                    (() => {
                      const left = Math.max(0, Math.ceil((new Date(r.review_submitted_at).getTime() + 3 * 86400000 - Date.now()) / 86400000));
                      return ` (${left}일 후 자동 확정)`;
                    })()}
                  <a href={r.review_url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", marginLeft: 6 }}>
                    내 리뷰 보기
                  </a>
                </div>
              )}

              {r.review_approved_at && (
                <div style={{ borderTop: "1px solid var(--line)", padding: "11px 16px", background: "#F4FBF7", fontSize: 12.5, fontWeight: 700, color: "#1FA45B" }}>
                  리뷰 승인 완료{reward > 0 ? ` — ${reward.toLocaleString()}P가 적립됐어요!` : " — 참여해주셔서 감사해요!"}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
