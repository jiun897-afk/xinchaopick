"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

type Msg = { id: string; sender_id: string; content: string; created_at: string; read_at: string | null };
type Room = {
  id: string;
  user_id: string;
  status: string;
  campaigns: { store_name: string; owner_id: string; image_url: string | null } | null;
};

/* 자주 쓰는 문구 (한↔베 병기 — 자동번역은 다음 단계) */
const QUICK = [
  { ko: "안녕하세요! 방문 가능한 시간이 언제인가요?", vi: "Xin chào! Tôi có thể ghé thăm lúc nào?" },
  { ko: "내일 오후에 방문해도 될까요?", vi: "Ngày mai buổi chiều tôi ghé được không?" },
  { ko: "네, 좋아요! 그때 뵐게요.", vi: "Vâng, được ạ! Hẹn gặp lúc đó." },
  { ko: "위치가 어디인가요?", vi: "Cửa hàng ở đâu ạ?" },
  { ko: "감사합니다!", vi: "Cảm ơn!" },
];

export default function ChatRoomPage() {
  const supabase = getSupabase();
  const [appId, setAppId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  useEffect(() => {
    setAppId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  async function loadMsgs(id: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at, read_at")
      .eq("application_id", id)
      .order("created_at", { ascending: true })
      .limit(200);
    const rows = (data as Msg[]) ?? [];
    setMsgs(rows);
    // 상대가 보낸 안읽은 메시지 → 읽음 처리
    if (rows.some((m) => m.read_at === null)) {
      supabase.rpc("mark_msgs_read", { p_app_id: id }).then(() => {});
    }
    if (rows.length !== lastCount.current) {
      lastCount.current = rows.length;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }

  useEffect(() => {
    if (!appId || !supabase) return;
    let timer: ReturnType<typeof setInterval>;
    let ch: any = null;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setMe(session?.user?.id ?? null);
      const { data: r } = await supabase
        .from("applications")
        .select("id, user_id, status, campaigns(store_name, owner_id, image_url)")
        .eq("id", appId)
        .maybeSingle();
      setRoom((r as unknown as Room) ?? null);
      loadMsgs(appId);
      // 실시간 수신 (즉시) + 15초 폴링은 안전망
      ch = supabase
        .channel("chat-" + appId)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: "application_id=eq." + appId },
          () => loadMsgs(appId)
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages", filter: "application_id=eq." + appId },
          () => loadMsgs(appId) // 상대가 읽으면 '읽음' 갱신
        )
        .subscribe();
      timer = setInterval(() => loadMsgs(appId), 15000);
    })();
    return () => {
      clearInterval(timer);
      if (ch) supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, supabase]);

  async function send(content?: string) {
    const body = (content ?? text).trim();
    if (!body || !supabase || !appId || !me) return;
    setErr("");
    setBusy(true);
    const { error } = await supabase.from("messages").insert({ application_id: appId, sender_id: me, content: body });
    setBusy(false);
    if (error) {
      setErr(error.message.includes("policy") ? "선정된 캠페인의 당사자만 채팅할 수 있어요." : error.message);
      return;
    }
    setText("");
    setShowQuick(false);
    loadMsgs(appId);
  }

  const iAmOwner = room && me && room.campaigns?.owner_id === me;
  const title = room?.campaigns?.store_name ?? "채팅";
  const partner = iAmOwner ? "리뷰어" : "사장님";

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 16, paddingBottom: 14, display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 16px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
        <Link href="/chat" style={{ fontSize: 20, fontWeight: 800, color: "var(--ink3)" }}>
          ←
        </Link>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: "var(--chip)",
            backgroundImage: room?.campaigns?.image_url ? "url(" + room.campaigns.image_url + ")" : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--ink3)" }}>{partner}와의 대화 · 방문 일정을 정해보세요</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 2px" }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink3)", padding: "30px 0", lineHeight: 1.8 }}>
            채팅이 열렸어요! 첫 메시지를 보내보세요.
            <br />
            아래 <b>자주 쓰는 문구</b>를 누르면 베트남어가 함께 전송돼요.
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

      {showQuick && (
        <div style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
          {QUICK.map((q) => (
            <div
              key={q.ko}
              onClick={() => send(q.ko + "\n" + q.vi)}
              style={{ background: "var(--chip)", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, marginTop: 6, cursor: "pointer", lineHeight: 1.5 }}
            >
              <b>{q.ko}</b>
              <div style={{ color: "var(--ink3)", fontSize: 11.5 }}>{q.vi}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
        <button
          className="btn ghost"
          style={{ padding: "0 13px", fontSize: 17, flexShrink: 0 }}
          onClick={() => setShowQuick((v) => !v)}
          aria-label="자주 쓰는 문구"
        >
          {showQuick ? "×" : "+"}
        </button>
        <input
          style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--line)", borderRadius: 999, padding: "12px 16px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff" }}
          placeholder="메시지 입력"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
        />
        <button className="btn pri" style={{ padding: "0 18px", fontSize: 13.5, borderRadius: 999, flexShrink: 0 }} onClick={() => send()} disabled={busy}>
          전송
        </button>
      </div>
    </div>
  );
}
