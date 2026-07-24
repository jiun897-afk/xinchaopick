"use client";
/* 채팅 자동 번역 훅 — 내 언어(bv_lang)와 다른 언어 메시지만 서버에 번역 요청.
   같은 언어끼리 대화하면 아무 요청도 안 나감(비용 0). 실패한 메시지는 재시도 안 함. */
import { useRef, useState } from "react";
import { getLang } from "./i18n";
import { getSupabase } from "./supabase";

const hasHangul = (s: string) => /[가-힣]/.test(s);

export function needsTr(content: string | null | undefined, target: string) {
  const c = (content ?? "").trim();
  if (!c || c === "📷 사진") return false;
  if (c.length > 1500) return false;
  return target === "ko" ? !hasHangul(c) : hasHangul(c);
}

export function useChatTr(kind: "dm" | "camp") {
  const [trMap, setTrMap] = useState<Record<string, string>>({});
  const tried = useRef<Set<string>>(new Set());
  const busyRef = useRef(false);

  async function translate(msgs: { id: string; content: string }[]) {
    if (busyRef.current) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const target = getLang();
    const ids = msgs.filter((m) => needsTr(m.content, target) && !tried.current.has(m.id)).map((m) => m.id);
    if (!ids.length) return;
    busyRef.current = true;
    ids.forEach((id) => tried.current.add(id));
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
          body: JSON.stringify({ kind, ids, target }),
        });
        const j = await res.json().catch(() => null);
        if (j?.map && Object.keys(j.map).length) setTrMap((prev) => ({ ...prev, ...j.map }));
      }
    } catch {}
    busyRef.current = false;
  }

  return { trMap, translate };
}
