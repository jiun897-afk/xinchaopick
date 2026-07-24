"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";

type Notif = { id: string; type: string; title: string; body: string; link: string; read: boolean; created_at: string };

const ICON: Record<string, string> = {
  selected: "🎉",
  review: "📝",
  approved: "✅",
  issue: "⚠️",
  chat: "💬",
  topup: "💰",
  withdraw: "🏦",
  info: "🔔",
};

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "방금 전";
  if (s < 3600) return Math.floor(s / 60) + "분 전";
  if (s < 86400) return Math.floor(s / 3600) + "시간 전";
  return Math.floor(s / 86400) + "일 전";
}

export default function NotificationsPage() {
  const supabase = getSupabase();
  const router = useRouter();
  const [guest, setGuest] = useState(false);
  const [rows, setRows] = useState<Notif[] | null>(null);

  async function load() {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setGuest(true);
      return;
    }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setRows((data as Notif[]) ?? []);
  }

  useEffect(() => {
    if (!supabase) {
      setGuest(true);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function open(n: Notif) {
    if (supabase && !n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    }
    if (n.link) router.push(n.link);
    else load();
  }

  async function readAll() {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", session.user.id).eq("read", false);
    load();
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>알림</h1>
        {rows !== null && rows.some((r) => !r.read) && (
          <button className="btn ghost" style={{ marginLeft: "auto", padding: "8px 13px", fontSize: 12 }} onClick={readAll}>
            모두 읽음
          </button>
        )}
      </div>

      {guest && (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "var(--chip)", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>로그인 후 이용할 수 있어요.</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            로그인하기
          </Link>
        </div>
      )}

      {!guest && rows === null && <div style={{ marginTop: 24, fontSize: 14, color: "var(--ink3)" }}>불러오는 중…</div>}

      {!guest && rows !== null && rows.length === 0 && (
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <div style={{ fontSize: 34 }}>🔔</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 10 }}>아직 알림이 없어요</div>
          <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 6 }}>선정·채팅·포인트 소식이 여기로 와요.</p>
        </div>
      )}

      {!guest &&
        (rows ?? []).map((n) => (
          <div
            key={n.id}
            onClick={() => open(n)}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: "14px 12px",
              borderBottom: "1px solid var(--line)",
              cursor: "pointer",
              background: n.read ? "#fff" : "var(--brand-bg)",
              borderRadius: 10,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{ICON[n.type] ?? "🔔"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 700 : 900 }}>{n.title}</div>
              {n.body && <div style={{ fontSize: 12.5, color: "var(--ink2)", marginTop: 3, lineHeight: 1.55 }}>{n.body}</div>}
              <div style={{ fontSize: 10.5, color: "var(--ink3)", marginTop: 4 }}>{timeAgo(n.created_at)}</div>
            </div>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", flexShrink: 0, marginTop: 6 }} />}
          </div>
        ))}
    </div>
  );
}
