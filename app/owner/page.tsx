"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import { useLang, LangToggle, mkT } from "../../lib/i18n";

type Campaign = {
  id: string;
  store_name: string;
  category: string;
  offer: string;
  mission_type: string;
  quota: number;
  applied: number;
  status: string;
  image_url: string | null;
};

type App = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  review_url: string | null;
  review_approved_at: string | null;
  dispute_status: string | null;
  dispute_reason: string | null;
  nickname?: string;
};

const VI: Record<string, string> = {
  "사장님 센터": "Trung tâm đối tác",
  "캠페인을 올리고, 신청한 리뷰어를 선정하세요": "Đăng chiến dịch và chọn reviewer",
  "+ 새 캠페인": "+ Chiến dịch mới",
  "내 업체 관리": "Quản lý cửa hàng",
  "크레딧 충전": "Nạp credit",
  "사장님 센터는 로그인 후 이용할 수 있어요.": "Vui lòng đăng nhập để sử dụng Trung tâm đối tác.",
  "로그인하기": "Đăng nhập",
  "불러오는 중…": "Đang tải…",
  "아직 등록한 캠페인이 없어요": "Chưa có chiến dịch nào",
  "첫 캠페인을 올리면 한국인 리뷰어들이 신청하기 시작해요.": "Đăng chiến dịch đầu tiên để reviewer Hàn Quốc bắt đầu ứng tuyển.",
  "등록은 10분이면 충분해요.": "Chỉ mất khoảng 10 phút.",
  "첫 캠페인 등록하기": "Đăng chiến dịch đầu tiên",
  "신청": "Đơn",
  "신청자 불러오는 중…": "Đang tải danh sách ứng tuyển…",
  "아직 신청자가 없어요.": "Chưa có ai ứng tuyển.",
  "선정됨": "Đã chọn",
  "미선정": "Không chọn",
  "완료": "Hoàn tất",
  "대기": "Chờ",
  "선정": "Chọn",
  "취소": "Hủy",
  "리뷰": "Review",
  "채팅": "Chat",
  "리뷰 승인": "Duyệt review",
  "문제제기": "Báo vấn đề",
  "해결됨·승인": "Đã ổn · Duyệt",
  "분쟁 신청": "Nhờ phân xử",
  "운영팀 중재 중": "Đang phân xử",
  "신청함": "ứng tuyển",
  "어떤 문제가 있나요? (예: 사진과 다른 내용, 방문 확인 안 됨 등)\n문제제기하면 3일 자동확정이 멈추고 리뷰어와 협의하게 돼요.":
    "Có vấn đề gì? (VD: nội dung không đúng, không xác nhận được lượt ghé thăm)\nSau khi báo vấn đề, tự động duyệt sau 3 ngày sẽ tạm dừng để hai bên trao đổi.",
  "운영팀 중재(분쟁)를 신청할까요? 운영팀이 리뷰와 사유를 검토해 결정해요.":
    "Yêu cầu đội vận hành phân xử? Đội vận hành sẽ xem review và lý do rồi quyết định.",
};

export default function OwnerPage() {
  const supabase = getSupabase();
  const [lang, setLang] = useLang();
  const t = mkT(lang, VI);
  const [guest, setGuest] = useState(false);
  const [list, setList] = useState<Campaign[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [apps, setApps] = useState<Record<string, App[]>>({});
  const [busy, setBusy] = useState<string | null>(null);

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
        .from("campaigns")
        .select("id, store_name, category, offer, mission_type, quota, applied, status, image_url")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });
      setList((data as Campaign[]) ?? []);
    })();
  }, [supabase]);

  async function toggle(cid: string) {
    if (open === cid) {
      setOpen(null);
      return;
    }
    setOpen(cid);
    if (!apps[cid] && supabase) {
      const { data } = await supabase
        .from("applications")
        .select("id, user_id, status, created_at, review_url, review_approved_at, dispute_status, dispute_reason")
        .eq("campaign_id", cid)
        .order("created_at", { ascending: true });
      let rows = (data as App[]) ?? [];
      if (rows.length) {
        const ids = Array.from(new Set(rows.map((r) => r.user_id)));
        const { data: profs } = await supabase.from("profiles").select("id, nickname").in("id", ids);
        const nameMap: Record<string, string> = {};
        (profs ?? []).forEach((p: any) => (nameMap[p.id] = p.nickname));
        rows = rows.map((r) => ({ ...r, nickname: nameMap[r.user_id] ?? "리뷰어" }));
      }
      setApps((a) => ({ ...a, [cid]: rows }));
    }
  }

  async function setStatus(cid: string, appId: string, status: "selected" | "rejected" | "pending") {
    if (!supabase) return;
    setBusy(appId);
    const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
    if (!error) {
      setApps((a) => ({
        ...a,
        [cid]: (a[cid] ?? []).map((r) => (r.id === appId ? { ...r, status } : r)),
      }));
    }
    setBusy(null);
  }

  async function raiseIssue(cid: string, appId: string) {
    if (!supabase) return;
    const reason = prompt(t("어떤 문제가 있나요? (예: 사진과 다른 내용, 방문 확인 안 됨 등)\n문제제기하면 3일 자동확정이 멈추고 리뷰어와 협의하게 돼요."));
    if (!reason || !reason.trim()) return;
    setBusy(appId);
    const { error } = await supabase.rpc("raise_issue", { p_app_id: appId, p_reason: reason.trim() });
    if (!error) {
      setApps((a) => ({ ...a, [cid]: (a[cid] ?? []).map((r) => (r.id === appId ? { ...r, dispute_status: "issue", dispute_reason: reason.trim() } : r)) }));
    } else alert(error.message);
    setBusy(null);
  }

  async function escalate(cid: string, appId: string) {
    if (!supabase) return;
    if (!confirm(t("운영팀 중재(분쟁)를 신청할까요? 운영팀이 리뷰와 사유를 검토해 결정해요."))) return;
    setBusy(appId);
    const { error } = await supabase.rpc("escalate_dispute", { p_app_id: appId });
    if (!error) {
      setApps((a) => ({ ...a, [cid]: (a[cid] ?? []).map((r) => (r.id === appId ? { ...r, dispute_status: "dispute" } : r)) }));
    } else alert(error.message);
    setBusy(null);
  }

  async function approveReview(cid: string, appId: string) {
    if (!supabase) return;
    setBusy(appId);
    const { error } = await supabase.rpc("approve_review", { p_app_id: appId });
    if (!error) {
      setApps((a) => ({
        ...a,
        [cid]: (a[cid] ?? []).map((r) => (r.id === appId ? { ...r, status: "completed", review_approved_at: new Date().toISOString() } : r)),
      }));
    } else {
      alert(error.message);
    }
    setBusy(null);
  }

  const badge = (s: string) =>
    s === "selected"
      ? { t: t("선정됨"), bg: "#E8F7EF", c: "#1FA45B" }
      : s === "rejected"
      ? { t: t("미선정"), bg: "#F5F2ED", c: "#9B948B" }
      : s === "completed"
      ? { t: t("완료"), bg: "#E8F0FE", c: "#1A56DB" }
      : { t: t("대기"), bg: "#FFF4E0", c: "#8A6D1A" };

  const dateLoc = lang === "vi" ? "vi-VN" : "ko-KR";

  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", rowGap: 12 }}>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>{t("사장님 센터")}</h1>
          <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
            {t("캠페인을 올리고, 신청한 리뷰어를 선정하세요")}
          </div>
        </div>
        <span style={{ marginLeft: "auto" }}>
          <LangToggle lang={lang} setLang={setLang} />
        </span>
        <Link className="btn pri" style={{ padding: "11px 16px", fontSize: 13.5, flexShrink: 0 }} href="/owner/new">
          {t("+ 새 캠페인")}
        </Link>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <Link href="/owner/places" style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontWeight: 800, textAlign: "center" }}>
          {t("내 업체 관리")}
        </Link>
        <Link href="/owner/topup" style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontWeight: 800, textAlign: "center" }}>
          {t("크레딧 충전")}
        </Link>
      </div>

      {guest && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: "var(--chip)", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>
            {t("사장님 센터는 로그인 후 이용할 수 있어요.")}
          </div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            {t("로그인하기")}
          </Link>
        </div>
      )}

      {!guest && list === null && <div style={{ marginTop: 24, color: "var(--ink3)", fontSize: 14 }}>{t("불러오는 중…")}</div>}

      {!guest && list !== null && list.length === 0 && (
        <div style={{ marginTop: 24, textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{t("아직 등록한 캠페인이 없어요")}</div>
          <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
            {t("첫 캠페인을 올리면 한국인 리뷰어들이 신청하기 시작해요.")}
            <br />
            {t("등록은 10분이면 충분해요.")}
          </p>
          <Link className="btn pri" style={{ marginTop: 18, padding: "13px 26px" }} href="/owner/new">
            {t("첫 캠페인 등록하기")}
          </Link>
        </div>
      )}

      {!guest &&
        (list ?? []).map((c) => (
          <div key={c.id} style={{ border: "1px solid var(--line)", borderRadius: 16, marginTop: 14, overflow: "hidden" }}>
            <div
              onClick={() => toggle(c.id)}
              style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", cursor: "pointer" }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: "var(--chip)",
                  backgroundImage: c.image_url ? "url(" + c.image_url + ")" : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{c.store_name}</div>
                <div style={{ fontSize: 12, color: "var(--ink2)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.offer}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--brand-dark)" }}>
                  {c.applied}/{c.quota}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--ink3)" }}>{t("신청")}</div>
              </div>
            </div>
            {open === c.id && (
              <div style={{ borderTop: "1px solid var(--line)", padding: "6px 16px 14px", background: "#FBFAF8" }}>
                {!apps[c.id] && <div style={{ padding: "12px 0", fontSize: 13, color: "var(--ink3)" }}>{t("신청자 불러오는 중…")}</div>}
                {apps[c.id] && apps[c.id].length === 0 && (
                  <div style={{ padding: "12px 0", fontSize: 13, color: "var(--ink3)" }}>{t("아직 신청자가 없어요.")}</div>
                )}
                {(apps[c.id] ?? []).map((a) => {
                  const b = badge(a.status);
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "var(--brand)",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {(a.nickname ?? "리")[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800 }}>{a.nickname}</div>
                        <div style={{ fontSize: 10.5, color: "var(--ink3)" }}>
                          {new Date(a.created_at).toLocaleDateString(dateLoc)} {t("신청함")}
                        </div>
                      </div>
                      <span style={{ background: b.bg, color: b.c, fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: "4px 9px" }}>{b.t}</span>
                      {(a.status === "selected" || a.status === "completed") && (
                        <Link href={"/chatroom?id=" + a.id} style={{ fontSize: 11.5, fontWeight: 800, color: "var(--brand-dark)", flexShrink: 0 }}>
                          💬{t("채팅")}
                        </Link>
                      )}
                      {a.review_url && (
                        <a href={a.review_url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, fontWeight: 800, textDecoration: "underline", color: "var(--brand-dark)", flexShrink: 0 }}>
                          {t("리뷰")}
                        </a>
                      )}
                      {a.review_url && !a.review_approved_at && a.dispute_status === "dispute" ? (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#C0392B", flexShrink: 0 }}>{t("운영팀 중재 중")}</span>
                      ) : a.review_url && !a.review_approved_at && a.dispute_status === "issue" ? (
                        <>
                          <button className="btn pri" style={{ padding: "8px 11px", fontSize: 11.5 }} disabled={busy === a.id} onClick={() => approveReview(c.id, a.id)}>
                            {t("해결됨·승인")}
                          </button>
                          <button className="btn ghost" style={{ padding: "8px 11px", fontSize: 11.5, color: "#C0392B" }} disabled={busy === a.id} onClick={() => escalate(c.id, a.id)}>
                            {t("분쟁 신청")}
                          </button>
                        </>
                      ) : a.review_url && !a.review_approved_at ? (
                        <>
                          <button
                            className="btn pri"
                            style={{ padding: "8px 13px", fontSize: 12 }}
                            disabled={busy === a.id}
                            onClick={() => approveReview(c.id, a.id)}
                          >
                            {t("리뷰 승인")}
                          </button>
                          <button className="btn ghost" style={{ padding: "8px 10px", fontSize: 11.5 }} disabled={busy === a.id} onClick={() => raiseIssue(c.id, a.id)}>
                            {t("문제제기")}
                          </button>
                        </>
                      ) : a.review_approved_at ? null : a.status !== "selected" ? (
                        <button
                          className="btn pri"
                          style={{ padding: "8px 13px", fontSize: 12 }}
                          disabled={busy === a.id}
                          onClick={() => setStatus(c.id, a.id, "selected")}
                        >
                          {t("선정")}
                        </button>
                      ) : (
                        <button
                          className="btn ghost"
                          style={{ padding: "8px 13px", fontSize: 12 }}
                          disabled={busy === a.id}
                          onClick={() => setStatus(c.id, a.id, "pending")}
                        >
                          {t("취소")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
