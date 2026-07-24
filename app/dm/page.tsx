"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import Avatar from "../../components/Avatar";
import { compressImage } from "../../lib/imageTool";
import ReportModal from "../../components/ReportModal";

/* 유저 간 1:1 채팅 (DM) */
type Msg = { id: string; sender_id: string; content: string; created_at: string; read_at: string | null; image_url: string | null };

export default function DmPage() {
  const supabase = getSupabase();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [partner, setPartner] = useState<{ id: string; nickname: string; avatar_url?: string | null } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [isFriend, setIsFriend] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [viewer, setViewer] = useState<string | null>(null);
  const [sendingImg, setSendingImg] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [selIds, setSelIds] = useState<Set<string>>(new Set());

  function toggleSel(id: string) {
    setSelIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  const imgInRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);
  const leftAtRef = useRef<string | null>(null); // 내가 방을 나갔던 시각 — 그 이후 메시지만 표시

  useEffect(() => {
    setRoomId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  async function loadMsgs(id: string) {
    if (!supabase) return;
    let qy = supabase
      .from("dm_messages")
      .select("id, sender_id, content, created_at, read_at, image_url")
      .eq("room_id", id);
    if (leftAtRef.current) qy = qy.gt("created_at", leftAtRef.current);
    const { data } = await qy.order("created_at", { ascending: true }).limit(300);
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
      const { data: r } = await supabase.from("dm_rooms").select("id, user_a, user_b, left_a, left_b").eq("id", roomId).maybeSingle();
      if (r) {
        const other = (r as any).user_a === session.user.id ? (r as any).user_b : (r as any).user_a;
        leftAtRef.current = ((r as any).user_a === session.user.id ? (r as any).left_a : (r as any).left_b) ?? null;
        const [{ data: pv }, { data: blk }, { data: fr }] = await Promise.all([
          supabase.rpc("profiles_view", { p_ids: [other] }),
          supabase.from("blocks").select("blocked_id").eq("blocked_id", other).maybeSingle(),
          supabase.from("friends").select("friend_id").eq("friend_id", other).maybeSingle(),
        ]);
        const p = Array.isArray(pv) ? pv[0] : pv;
        setPartner({ id: other, nickname: (p as any)?.nickname ?? "회원", avatar_url: (p as any)?.avatar_url ?? null });
        setBlocked(!!blk);
        setIsFriend(!!fr);
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

  async function sendImage(f: File) {
    if (!supabase || !roomId || !me) return;
    setBusy(true);
    setErr("");
    const preview = URL.createObjectURL(f);
    setSendingImg(preview);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    try {
      const blob = await compressImage(f, 1080, 0.75);
      const path = me + "/" + Date.now() + ".jpg";
      const { error: ue } = await supabase.storage.from("chat").upload(path, blob, { contentType: "image/jpeg" });
      if (ue) throw new Error(ue.message);
      const { data: pub } = supabase.storage.from("chat").getPublicUrl(path);
      const { error } = await supabase.from("dm_messages").insert({ room_id: roomId, sender_id: me, content: "📷 사진", image_url: pub.publicUrl });
      if (error) throw new Error(error.message);
      loadMsgs(roomId);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      URL.revokeObjectURL(preview);
      setSendingImg(null);
      setBusy(false);
    }
  }

  function reportPartner() {
    setSelIds(new Set());
    setSelMode(true);
  }

  async function submitReport(reason: string) {
    if (!supabase || !roomId || !partner) return;
    setReportOpen(false);
    const ex = msgs
      .filter((m) => selIds.has(m.id))
      .map((m) => (m.sender_id === me ? "나" : "상대") + ": " + (m.image_url ? "[사진] " + m.image_url : m.content))
      .join("\n");
    const { error } = await supabase.rpc("report_chat", { p_kind: "dm", p_room: roomId, p_target: partner.id, p_reason: reason, p_excerpt: ex || null });
    setSelIds(new Set());
    if (error) alert(error.message);
    else alert("신고가 접수됐어요. 운영팀이 확인할게요.");
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 12, paddingBottom: 10, display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
        <Link href="/chat" style={{ fontSize: 20, fontWeight: 800, color: "var(--ink3)" }}>
          ←
        </Link>
        <Avatar url={partner?.avatar_url} name={partner?.nickname} size={38} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>{partner?.nickname ?? "채팅"}</div>
          <div style={{ fontSize: 11, color: "var(--ink3)" }}>{blocked ? "차단한 상대" : "회원 간 1:1 대화"}</div>
        </div>
        {partner && (
          <span onClick={reportPartner} style={{ marginLeft: "auto", color: "var(--ink2)", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0, padding: "9px 13px", border: "1px solid var(--line)", borderRadius: 999, background: "#fff" }}>
            신고
          </span>
        )}
        {partner && isFriend === false && !blocked && (
          <span
            onClick={async () => {
              if (!supabase || !me || !partner) return;
              await supabase.from("friends").insert({ user_id: me, friend_id: partner.id });
              setIsFriend(true);
            }}
            style={{ color: "var(--brand-dark)", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0, padding: "9px 13px", border: "1px solid var(--line)", borderRadius: 999, background: "#fff" }}
          >
            ＋ 친구 추가
          </span>
        )}
        {partner && (
          <span
            onClick={async () => {
              if (!supabase || !me) return;
              if (blocked) {
                if (!confirm("차단을 해제할까요?")) return;
                await supabase.from("blocks").delete().eq("user_id", me).eq("blocked_id", partner.id);
                setBlocked(false);
              } else {
                if (!confirm(partner.nickname + "님을 차단할까요?\n서로 메시지를 보낼 수 없고, 내 프로필 사진이 상대에게 보이지 않아요.")) return;
                await supabase.from("blocks").insert({ user_id: me, blocked_id: partner.id });
                setBlocked(true);
              }
            }}
            style={{ color: blocked ? "var(--ink3)" : "#C0392B", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0, padding: "9px 13px", border: "1px solid var(--line)", borderRadius: 999, background: "#fff" }}
          >
            {blocked ? "차단 해제" : "차단"}
          </span>
        )}
      </div>

      {selMode && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--brand-bg)", border: "1px solid var(--brand)", borderRadius: 12, padding: "9px 12px", marginTop: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--brand-dark)", flex: 1 }}>신고할 대화를 눌러 선택하세요 ({selIds.size}개)</span>
          <button className="btn ghost" style={{ padding: "8px 13px", fontSize: 12.5 }} onClick={() => { setSelMode(false); setSelIds(new Set()); }}>취소</button>
          <button className="btn pri" style={{ padding: "8px 15px", fontSize: 12.5 }} onClick={() => { setSelMode(false); setReportOpen(true); }}>다음</button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "14px 2px" }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink3)", padding: "30px 0" }}>
            첫 메시지를 보내보세요!
          </div>
        )}
        {msgs.map((m, i) => {
          const mine = m.sender_id === me;
          const lastMine = mine && msgs.slice(i + 1).every((x) => x.sender_id !== me);
          return (
            <div key={m.id} onClick={() => selMode && toggleSel(m.id)} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", marginTop: 8, borderRadius: 12, background: selIds.has(m.id) ? "rgba(240,78,26,.12)" : undefined, outline: selIds.has(m.id) ? "1.5px solid var(--brand)" : undefined, padding: selMode ? 4 : undefined, cursor: selMode ? "pointer" : undefined }}>
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
                {m.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image_url}
                    alt=""
                    onClick={(e) => { if (selMode) return; e.stopPropagation(); setViewer(m.image_url); }}
                    style={{ width: 200, maxWidth: "58vw", height: "auto", borderRadius: 12, display: "block", cursor: "pointer", marginBottom: m.content && m.content !== "📷 사진" ? 6 : 0 }}
                  />
                )}
                {(!m.image_url || m.content !== "📷 사진") && m.content}
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
        {sendingImg && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginTop: 8 }}>
            <div style={{ maxWidth: "78%", background: "var(--brand)", borderRadius: "16px 16px 4px 16px", padding: 6, position: "relative", opacity: 0.85 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sendingImg} alt="" style={{ width: 180, maxWidth: "58vw", height: "auto", borderRadius: 12, display: "block", filter: "brightness(.75)" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "6px 12px", display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "vjspin .8s linear infinite" }} />
                  전송 중…
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {err && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#C0392B", padding: "6px 0" }}>{err}</div>}

      <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--line)", alignItems: "center" }}>
        <input ref={imgInRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) sendImage(f); }} />
        <span onClick={() => imgInRef.current?.click()} style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--chip)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, alignSelf: "center" }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <input
          style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--line)", borderRadius: 999, padding: "12px 16px", fontSize: 14, fontFamily: "inherit", outline: "none" }}
          placeholder="메시지 입력"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
        />
        <button className="btn pri" style={{ padding: "13px 22px", borderRadius: 999, fontSize: 14.5 }} disabled={busy} onClick={() => send()}>
          전송
        </button>
      </div>

      {viewer && (
        <div onClick={() => setViewer(null)} style={{ position: "fixed", inset: 0, zIndex: 960, background: "rgba(10,8,6,.93)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewer} alt="" style={{ maxWidth: "94vw", maxHeight: "80vh", borderRadius: 12 }} />
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ color: "#ccc", fontSize: 13, fontWeight: 800 }}>탭하면 닫기</span>
            <span onClick={(e) => { e.stopPropagation(); setViewer(null); reportPartner(); }} style={{ color: "#ff8a80", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>🚨 이 사진 신고</span>
          </div>
        </div>
      )}
      {reportOpen && <ReportModal onCancel={() => setReportOpen(false)} onSubmit={submitReport} />}
    </div>
  );
}
