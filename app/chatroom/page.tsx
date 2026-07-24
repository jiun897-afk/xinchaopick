"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import { compressImage } from "../../lib/imageTool";
import ReportModal from "../../components/ReportModal";
import { useChatTr } from "../../lib/useChatTr";
import { useMsgActions } from "../../lib/useMsgActions";
import { useLang } from "../../lib/i18n";
import { IcGlobe } from "../../components/Ic";

type Msg = { id: string; sender_id: string; content: string; created_at: string; read_at: string | null; image_url: string | null; deleted_at?: string | null };
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
  const [viewer, setViewer] = useState<string | null>(null);
  const [sendingImg, setSendingImg] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [selIds, setSelIds] = useState<Set<string>>(new Set());
  const { trMap, translate, trOn, toggleTr, showOrig, toggleOrig } = useChatTr("camp"); // 한↔베 자동 번역
  const { hidden, loadHidden, pressHandlers, sheet: msgSheet } = useMsgActions("camp", () => appId && loadMsgs(appId)); // 꾹 눌러 삭제
  const [lang] = useLang();
  const vi = lang === "vi";

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

  useEffect(() => {
    setAppId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  async function loadMsgs(id: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at, read_at, image_url, deleted_at")
      .eq("application_id", id)
      .order("created_at", { ascending: true })
      .limit(200);
    const rows = (data as Msg[]) ?? [];
    setMsgs(rows);
    translate(rows);
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
      loadHidden();
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

  async function sendImage(f: File) {
    if (!supabase || !appId || !me) return;
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
      const { error } = await supabase.from("messages").insert({ application_id: appId, sender_id: me, content: "📷 사진", image_url: pub.publicUrl });
      if (error) throw new Error(error.message);
      loadMsgs(appId);
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
    if (!supabase || !appId || !room || !me) return;
    const other = room.campaigns?.owner_id === me ? room.user_id : room.campaigns?.owner_id;
    setReportOpen(false);
    const ex = msgs
      .filter((m) => selIds.has(m.id))
      .map((m) => (m.sender_id === me ? "나" : "상대") + ": " + (m.image_url ? "[사진] " + m.image_url : m.content))
      .join("\n");
    const { error } = await supabase.rpc("report_chat", { p_kind: "camp", p_room: appId, p_target: other ?? null, p_reason: reason, p_excerpt: ex || null });
    setSelIds(new Set());
    if (error) alert(error.message);
    else alert("신고가 접수됐어요. 운영팀이 확인할게요.");
  }

  const iAmOwner = room && me && room.campaigns?.owner_id === me;
  const title = room?.campaigns?.store_name ?? "채팅";
  const partner = iAmOwner ? "리뷰어" : "사장님";

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 12, paddingBottom: 10, display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
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
        <span
          onClick={() => {
            if (toggleTr()) translate(msgs);
          }}
          title="자동 번역 켜기/끄기"
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, color: trOn ? "var(--brand-dark)" : "var(--ink3)", opacity: trOn ? 1 : 0.6, fontSize: 12.5, fontWeight: 800, cursor: "pointer", flexShrink: 0, padding: "9px 11px", border: trOn ? "1.5px solid var(--brand)" : "1px solid var(--line)", borderRadius: 999, background: "#fff" }}
        >
          <IcGlobe size={13} />
          {trOn ? (vi ? "Dịch" : "번역") : vi ? "Tắt dịch" : "번역 꺼짐"}
        </span>
        <span onClick={reportPartner} style={{ color: "var(--ink2)", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0, padding: "9px 13px", border: "1px solid var(--line)", borderRadius: 999, background: "#fff" }}>
          신고
        </span>
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
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink3)", padding: "30px 0", lineHeight: 1.8 }}>
            채팅이 열렸어요! 첫 메시지를 보내보세요.
            <br />
            아래 <b>자주 쓰는 문구</b>를 누르면 베트남어가 함께 전송돼요.
          </div>
        )}
        {msgs.filter((m) => !hidden.has(m.id)).map((m, i, arr) => {
          const mine = m.sender_id === me;
          const lastMine = mine && arr.slice(i + 1).every((x) => x.sender_id !== me);
          return (
            <div key={m.id} onClick={() => selMode && toggleSel(m.id)} {...pressHandlers(m, mine, !!m.deleted_at, selMode)} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", marginTop: 8, borderRadius: 12, background: selIds.has(m.id) ? "rgba(240,78,26,.12)" : undefined, outline: selIds.has(m.id) ? "1.5px solid var(--brand)" : undefined, padding: selMode ? 4 : undefined, cursor: selMode ? "pointer" : undefined }}>
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
                {m.deleted_at ? (
                  <span style={{ opacity: 0.6, fontStyle: "italic", fontSize: 13 }}>{vi ? "Tin nhắn đã bị xóa" : "삭제된 메시지입니다"}</span>
                ) : (
                  <>
                {m.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image_url}
                    alt=""
                    onClick={(e) => { if (selMode) return; e.stopPropagation(); setViewer(m.image_url); }}
                    style={{ width: 200, maxWidth: "58vw", height: "auto", borderRadius: 12, display: "block", cursor: "pointer", marginBottom: m.content && m.content !== "📷 사진" ? 6 : 0 }}
                  />
                )}
                {(!m.image_url || m.content !== "📷 사진") &&
                  (trOn && trMap[m.id] && !showOrig.has(m.id) ? trMap[m.id] : m.content)}
                {trOn && trMap[m.id] && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOrig(m.id);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      marginTop: 6,
                      cursor: "pointer",
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: mine ? "rgba(255,255,255,.22)" : "var(--chip)",
                      color: mine ? "#fff" : "var(--ink2)",
                    }}
                  >
                    <IcGlobe size={10} />
                    {showOrig.has(m.id)
                      ? vi
                        ? "Bản gốc · xem bản dịch"
                        : "원문 · 번역 보기"
                      : vi
                        ? "Đã dịch · xem bản gốc"
                        : "번역됨 · 원문 보기"}
                  </div>
                )}
                  </>
                )}
                <div style={{ fontSize: 9.5, opacity: 0.65, marginTop: 4, textAlign: "right" }}>
                  {new Date(m.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {lastMine && (
                <div style={{ fontSize: 10, fontWeight: 800, color: m.read_at ? "var(--ink3)" : "#F0A860", marginTop: 3, paddingRight: 4 }}>
                  {m.read_at ? (vi ? "Đã đọc" : "읽음") : vi ? "Chưa đọc" : "안읽음"}
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
        <input ref={imgInRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) sendImage(f); }} />
        <span onClick={() => imgInRef.current?.click()} style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--chip)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, alignSelf: "center" }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <input
          style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--line)", borderRadius: 999, padding: "12px 16px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff" }}
          placeholder={vi ? "Nhập tin nhắn" : "메시지 입력"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
        />
        <button className="btn pri" style={{ padding: "13px 22px", fontSize: 14.5, borderRadius: 999, flexShrink: 0 }} onClick={() => send()} disabled={busy}>
          {vi ? "Gửi" : "전송"}
        </button>
      </div>

      {viewer && (
        <div
          onClick={() => setViewer(null)}
          style={{ position: "fixed", inset: 0, zIndex: 960, background: "rgba(10,8,6,.93)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewer} alt="" style={{ maxWidth: "94vw", maxHeight: "80vh", borderRadius: 12 }} />
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ color: "#ccc", fontSize: 13, fontWeight: 800 }}>탭하면 닫기</span>
            <span onClick={(e) => { e.stopPropagation(); setViewer(null); reportPartner(); }} style={{ color: "#ff8a80", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>{vi ? "Báo cáo ảnh này" : "이 사진 신고"}</span>
          </div>
        </div>
      )}
      {reportOpen && <ReportModal onCancel={() => setReportOpen(false)} onSubmit={submitReport} />}
      {msgSheet}
    </div>
  );
}
