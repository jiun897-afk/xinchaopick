"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

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
  nickname?: string;
};

export default function OwnerPage() {
  const supabase = getSupabase();
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
        .select("id, user_id, status, created_at")
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

  const badge = (s: string) =>
    s === "selected"
      ? { t: "선정됨", bg: "#E8F7EF", c: "#1FA45B" }
      : s === "rejected"
      ? { t: "미선정", bg: "#F5F2ED", c: "#9B948B" }
      : { t: "대기", bg: "#FFF4E0", c: "#8A6D1A" };

  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>사장님 센터</h1>
          <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
            캠페인을 올리고, 신청한 리뷰어를 선정하세요
          </div>
        </div>
        <Link className="btn pri" style={{ marginLeft: "auto", padding: "11px 16px", fontSize: 13.5 }} href="/owner/new">
          + 새 캠페인
        </Link>
      </div>

      {guest && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: "var(--chip)", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>
            사장님 센터는 로그인 후 이용할 수 있어요.
          </div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            로그인하기
          </Link>
        </div>
      )}

      {!guest && list === null && <div style={{ marginTop: 24, color: "var(--ink3)", fontSize: 14 }}>불러오는 중…</div>}

      {!guest && list !== null && list.length === 0 && (
        <div style={{ marginTop: 24, textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>아직 등록한 캠페인이 없어요</div>
          <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
            첫 캠페인을 올리면 한국인 리뷰어들이 신청하기 시작해요.
            <br />
            등록은 10분이면 충분해요.
          </p>
          <Link className="btn pri" style={{ marginTop: 18, padding: "13px 26px" }} href="/owner/new">
            첫 캠페인 등록하기
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
                <div style={{ fontSize: 10.5, color: "var(--ink3)" }}>신청</div>
              </div>
            </div>
            {open === c.id && (
              <div style={{ borderTop: "1px solid var(--line)", padding: "6px 16px 14px", background: "#FBFAF8" }}>
                {!apps[c.id] && <div style={{ padding: "12px 0", fontSize: 13, color: "var(--ink3)" }}>신청자 불러오는 중…</div>}
                {apps[c.id] && apps[c.id].length === 0 && (
                  <div style={{ padding: "12px 0", fontSize: 13, color: "var(--ink3)" }}>아직 신청자가 없어요.</div>
                )}
                {(apps[c.id] ?? []).map((a) => {
                  const b = badge(a.status);
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
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
                        <div style={{ fontSize: 10.5, color: "var(--ink3)" }}>{new Date(a.created_at).toLocaleDateString("ko-KR")} 신청</div>
                      </div>
                      <span style={{ background: b.bg, color: b.c, fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: "4px 9px" }}>{b.t}</span>
                      {a.status !== "selected" ? (
                        <button
                          className="btn pri"
                          style={{ padding: "8px 13px", fontSize: 12 }}
                          disabled={busy === a.id}
                          onClick={() => setStatus(c.id, a.id, "selected")}
                        >
                          선정
                        </button>
                      ) : (
                        <button
                          className="btn ghost"
                          style={{ padding: "8px 13px", fontSize: 12 }}
                          disabled={busy === a.id}
                          onClick={() => setStatus(c.id, a.id, "pending")}
                        >
                          취소
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
