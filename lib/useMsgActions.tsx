"use client";
/* 메시지 꾹 누르기 → 삭제 액션 시트 (카톡식)
   - 모두에게서 삭제: 내가 보낸 메시지만, "삭제된 메시지입니다"로 바뀜
   - 나에게만 삭제: 내 화면에서만 숨김 */
import { useRef, useState } from "react";
import { getSupabase } from "./supabase";

export function useMsgActions(kind: "dm" | "camp", onChanged: () => void) {
  const supabase = getSupabase();
  const [target, setTarget] = useState<{ id: string; mine: boolean; deleted: boolean } | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const openedAt = useRef(0);
  const longRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pos = useRef<{ x: number; y: number } | null>(null);

  async function loadHidden() {
    if (!supabase) return;
    const { data } = await supabase.from("msg_hide").select("msg_id").eq("kind", kind);
    setHidden(new Set(((data as any[]) ?? []).map((x) => x.msg_id)));
  }

  function pressHandlers(m: { id: string }, mine: boolean, deleted: boolean, disabled: boolean) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        if (disabled) return;
        pos.current = { x: e.clientX, y: e.clientY };
        longRef.current = setTimeout(() => {
          longRef.current = null;
          openedAt.current = Date.now();
          setTarget({ id: m.id, mine, deleted });
        }, 500);
      },
      onPointerUp: () => longRef.current && clearTimeout(longRef.current),
      onPointerMove: (e: React.PointerEvent) => {
        if (!longRef.current || !pos.current) return;
        const dx = e.clientX - pos.current.x;
        const dy = e.clientY - pos.current.y;
        if (dx * dx + dy * dy > 144) clearTimeout(longRef.current);
      },
      onPointerLeave: () => longRef.current && clearTimeout(longRef.current),
    };
  }

  async function delAll() {
    if (!supabase || !target || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("delete_msg_all", { p_kind: kind, p_msg: target.id });
    if (error) alert(error.message);
    setBusy(false);
    setTarget(null);
    onChanged();
  }

  async function delMe() {
    if (!supabase || !target || busy) return;
    setBusy(true);
    await supabase.rpc("hide_msg", { p_kind: kind, p_msg: target.id });
    setHidden((prev) => {
      const n = new Set(prev);
      n.add(target.id);
      return n;
    });
    setBusy(false);
    setTarget(null);
  }

  const sheet = target ? (
    <div
      onClick={() => {
        if (Date.now() - openedAt.current > 350) setTarget(null);
      }}
      style={{ position: "fixed", inset: 0, zIndex: 975, background: "rgba(20,15,10,.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "22px 22px 0 0", padding: "20px 18px 26px" }}>
        <div style={{ fontSize: 15, fontWeight: 900 }}>메시지 삭제</div>
        {target.mine && !target.deleted && (
          <>
            <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 4 }}>모두에게서 삭제하면 상대 화면에도 &ldquo;삭제된 메시지입니다&rdquo;로 바뀌어요.</div>
            <button
              onClick={delAll}
              disabled={busy}
              style={{ width: "100%", marginTop: 14, padding: "14px 0", borderRadius: 14, border: "none", background: "#E0483E", color: "#fff", fontSize: 14.5, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}
            >
              🗑 모두에게서 삭제
            </button>
          </>
        )}
        <button className="btn ghost" style={{ width: "100%", marginTop: 8, padding: "13px 0" }} disabled={busy} onClick={delMe}>
          나에게만 삭제
        </button>
        <button className="btn ghost" style={{ width: "100%", marginTop: 8, padding: "13px 0", border: "none", color: "var(--ink3)" }} onClick={() => setTarget(null)}>
          취소
        </button>
      </div>
    </div>
  ) : null;

  return { hidden, loadHidden, pressHandlers, sheet };
}
