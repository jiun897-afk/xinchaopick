"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import Avatar from "../../components/Avatar";

/* 차단 친구 관리 */
export default function BlockedPage() {
  const supabase = getSupabase();
  const [list, setList] = useState<{ id: string; nickname: string; handle: string | null; avatar_url: string | null }[] | null>(null);
  const [guest, setGuest] = useState(false);
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
      const { data: bl } = await supabase.from("blocks").select("blocked_id").eq("user_id", session.user.id);
      const ids = ((bl as any[]) ?? []).map((x) => x.blocked_id);
      if (!ids.length) {
        setList([]);
        return;
      }
      const { data: pv } = await supabase.rpc("profiles_view", { p_ids: ids });
      setList(
        ids.map((id) => {
          const p = ((pv as any[]) ?? []).find((x) => x.id === id);
          return { id, nickname: p?.nickname ?? "회원", handle: p?.handle ?? null, avatar_url: p?.avatar_url ?? null };
        })
      );
    })();
  }, [supabase]);

  async function unblock(id: string) {
    if (!supabase) return;
    if (!confirm("차단을 해제할까요?")) return;
    setBusy(id);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("blocks").delete().eq("user_id", session.user.id).eq("blocked_id", id);
      setList((l) => (l ?? []).filter((x) => x.id !== id));
    }
    setBusy(null);
  }

  return (
    <div className="wrap" style={{ maxWidth: 560, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/me" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>← 마이</Link>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>차단 관리</h1>
      <p style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 4 }}>
        차단하면 서로 메시지를 보낼 수 없고, 내 프로필 사진이 상대에게 보이지 않아요.
      </p>

      {guest && (
        <Link className="btn pri" style={{ marginTop: 18, padding: "12px 22px" }} href="/login">로그인하기</Link>
      )}
      {!guest && list === null && <div style={{ marginTop: 20, fontSize: 13.5, color: "var(--ink3)" }}>불러오는 중…</div>}
      {!guest && list !== null && list.length === 0 && (
        <div style={{ marginTop: 30, textAlign: "center", fontSize: 13.5, color: "var(--ink3)", padding: "30px 0" }}>
          차단한 친구가 없어요.
        </div>
      )}
      {(list ?? []).map((b) => (
        <div key={b.id} style={{ display: "flex", gap: 12, alignItems: "center", borderBottom: "1px solid var(--line)", padding: "13px 2px" }}>
          <Avatar url={b.avatar_url} name={b.nickname} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>{b.nickname}</div>
            {b.handle && <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 2 }}>@{b.handle}</div>}
          </div>
          <button className="btn ghost" style={{ padding: "9px 15px", fontSize: 12.5 }} disabled={busy === b.id} onClick={() => unblock(b.id)}>
            차단 해제
          </button>
        </div>
      ))}
    </div>
  );
}
