"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

/* QR/링크로 친구 추가: /add?h=아이디 */
export default function AddFriendPage() {
  const supabase = getSupabase();
  const [target, setTarget] = useState<{ id: string; nickname: string; handle: string } | null | "loading">("loading");
  const [me, setMe] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = new URLSearchParams(window.location.search).get("h");
    if (!supabase || !h) {
      setTarget(null);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setMe(session.user.id);
      const { data } = await supabase.rpc("find_by_handle", { p_handle: h });
      const row = Array.isArray(data) ? data[0] : data;
      setTarget(row ?? null);
      if (row) {
        const { data: fr } = await supabase.from("friends").select("friend_id").eq("friend_id", row.id).maybeSingle();
        if (fr) setAdded(true);
      }
    })();
  }, [supabase]);

  async function addFriend() {
    if (!supabase || !target || target === "loading" || !me) return;
    setBusy(true);
    await supabase.from("friends").insert({ user_id: me, friend_id: target.id });
    setAdded(true);
    setBusy(false);
  }

  async function chat() {
    if (!supabase || !target || target === "loading") return;
    const { data, error } = await supabase.rpc("start_dm", { p_other: target.id });
    if (error) alert(error.message);
    else window.location.href = "/dm?id=" + data;
  }

  return (
    <div className="wrap" style={{ maxWidth: 480, paddingTop: 40, paddingBottom: 90, textAlign: "center" }}>
      {target === "loading" ? (
        <div style={{ fontSize: 13.5, color: "var(--ink3)" }}>확인 중…</div>
      ) : !target ? (
        <>
          <div style={{ fontSize: 40 }}>🙈</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, marginTop: 12 }}>아이디를 찾을 수 없어요</h1>
          <Link className="btn pri" style={{ marginTop: 18, padding: "12px 24px" }} href="/">홈으로</Link>
        </>
      ) : target.id === me ? (
        <>
          <div style={{ fontSize: 40 }}>😄</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, marginTop: 12 }}>내 아이디예요!</h1>
          <Link className="btn pri" style={{ marginTop: 18, padding: "12px 24px" }} href="/my-id">내 QR 보기</Link>
        </>
      ) : (
        <>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--brand)", color: "#fff", fontWeight: 900, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            {target.nickname[0]?.toUpperCase() ?? "?"}
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 900, marginTop: 14 }}>{target.nickname}</h1>
          <div style={{ fontSize: 13, color: "var(--ink3)", marginTop: 3 }}>@{target.handle}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
            <button className="btn ghost" style={{ padding: "13px 22px" }} disabled={busy || added} onClick={addFriend}>
              {added ? "✓ 친구 추가됨" : "＋ 친구 추가"}
            </button>
            <button className="btn pri" style={{ padding: "13px 26px" }} onClick={chat}>
              💬 채팅하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
