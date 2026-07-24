"use client";
/* 채팅 자동 번역 훅 — 내 언어(bv_lang)와 다른 언어 메시지만 서버에 번역 요청.
   같은 언어끼리 대화하면 아무 요청도 안 나감(비용 0). 실패한 메시지는 재시도 안 함. */
import { useEffect, useRef, useState } from "react";
import { getLang } from "./i18n";
import { getSupabase } from "./supabase";

const hasHangul = (s: string) => /[가-힣]/.test(s);

export function needsTr(content: string | null | undefined, target: string) {
  const c = (content ?? "").trim();
  if (!c || c === "📷 사진" || c === "삭제된 메시지입니다") return false;
  if (c.length > 1500) return false;
  return target === "ko" ? !hasHangul(c) : hasHangul(c);
}

export function useChatTr(kind: "dm" | "camp") {
  const [trMap, setTrMap] = useState<Record<string, string>>({});
  const tried = useRef<Set<string>>(new Set());
  const busyRef = useRef(false);
  // 번역 켜기/끄기 (기기별 저장) + 메시지별 "원문 보기"
  const [trOn, setTrOnState] = useState(true);
  const trOnRef = useRef(true);
  const [showOrig, setShowOrig] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const v = localStorage.getItem("bv_tr_on") !== "0";
      setTrOnState(v);
      trOnRef.current = v;
    } catch {}
  }, []);

  function toggleTr(): boolean {
    const n = !trOnRef.current;
    trOnRef.current = n;
    setTrOnState(n);
    try {
      localStorage.setItem("bv_tr_on", n ? "1" : "0");
    } catch {}
    return n;
  }

  function toggleOrig(id: string) {
    setShowOrig((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function translate(msgs: { id: string; content: string }[]) {
    if (busyRef.current || !trOnRef.current) return;
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

  return { trMap, translate, trOn, toggleTr, showOrig, toggleOrig };
}
