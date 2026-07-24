"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

/* 유저 간 1:1 채팅 (DM) */
type Msg = { id: string; sender_id: string; content: string; created_at: string; read_at: string | null };

export default function DmPage() {
  const supabase = getSupabase();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [partner, setPartner] = useState<{ id: string; nickname: string } | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  useEffect(() => {
    setRoomId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  async function loadMsgs(id: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("dm_messages")
      .select("id, sender_id, content, created_at, read_at")
      .eq("room_id", id)
      .order("created_at", { ascending: true })
      .limit(300);
    const rows = (data as Msg[]) ?? [];
    setMsgs(rows);
    if (rows.some((m) => m.read_at === null)) {
      supabase.rpc("mark_dm_read", { p_room: id }).then(() => {});
    }
    if (rows.length !== lastCount.current) {
      lastCount.current = rows.length;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }

  useEffect(() => {
    if (!roomId || !supabase) return;
    let timer: ReturnType<typeof setInterval>;
    let ch: any = null;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setMe(session.user.id);
      const { data: r } = await supabase.from("dm_rooms").select("id, user_a, user_b").eq("id", roomId).maybeSingle();
      if (r) {
        const other = (r as any).user_a === session.user.id ? (r as any).user_b : (r as any).user_a;
        const { data: p } = await supabase.from("profiles").select("id, nickname").eq("id", other).maybeSingle();
        setPartner({ id: other, nickname: (p as any)?.nickname ?? "회원" });
      }
      loadMsgs(roomId);
      ch = supabase
        .channel("dm-" + roomId)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages", filter: "room_id=eq." + roomId }, () => loadMsgs(roomId))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dm_messages", filter: "room_id=eq." + roomId }, () => loadMsgs(roomId))
        .subscribe();
      timer = setInterval(() => loadMsgs(roomId), 15000);
    })();
    return () => {
      clearInterval(timer);
      if (ch) supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, supabase]);

  async function send() {
    const body = text.trim();
    if (!body || !supabase || !roomId || !me) return;
    setErr("");
    setBusy(true);
    const { error } = await supabase.from("dm_messages").insert({ room_id: roomId, sender_id: me, content: body });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setText("");
    loadMsgs(roomId);
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 12, paddingBottom: 10, display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
        <Link href="/chat" style={{ fontSize: 20, fontWeight: 800, color: "var(--ink3)" }}>
          ←
        </Link>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--brand)", color: "#fff", fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {partner?.nickname?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>{partner?.nickname ?? "채팅"}</div>
          <div style={{ fontSize: 11, color: "var(--ink3)" }}>회원 간 1:1 대화</div>
        </div>
        {partner && (
          <Link href={"/reviewer?id=" + partner.id} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: "var(--brand-dark)", textDecoration: "underline", flexShrink: 0 }}>
            프로필
          </Link>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 2px" }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink3)", padding: "30px 0" }}>
            첫 메시지를 보내보세요!
          </div>
        )}
        {msgs.map((m, i) => {
          const mine = m.sender_id === me;
          const lastMine = mine && msgs.slice(i + 1).every((x) => x.sender_id !== me);
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", marginTop: 8 }}>
              <div
                style={{
                  maxWidth: "78%",
                  background: mine ? "var(--brand)" : "#fff",
                  color: mine ? "#fff" : "var(--ink)",
                  border: mine ? "none" : "1px solid var(--line)",
                  borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "10px 14px",
                  fontSize: 14,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.content}
                <div style={{ fontSize: 9.5, opacity: 0.65, marginTop: 4, textAlign: "right" }}>
                  {new Date(m.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {lastMine && (
                <div style={{ fontSize: 10, fontWeight: 800, color: m.read_at ? "var(--ink3)" : "#F0A860", marginTop: 3, paddingRight: 4 }}>
                  {m.read_at ? "읽음" : "안읽음"}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {err && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#C0392B", padding: "6px 0" }}>{err}</div>}

      <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
        <input
          style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--line)", borderRadius: 999, padding: "12px 16px", fontSize: 14, fontFamily: "inherit", outline: "none" }}
          placeholder="메시지 입력"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
        />
        <button className="btn pri" style={{ padding: "0 18px", borderRadius: 999 }} disabled={busy} onClick={() => send()}>
          전송
        </button>
      </div>
    </div>
  );
}
