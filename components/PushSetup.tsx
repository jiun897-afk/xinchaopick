"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

export default function PushSetup() {
  const supabase = getSupabase();
  const [state, setState] = useState<"unsupported" | "off" | "on" | "denied" | "busy" | "loading">("loading");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setState(sub ? "on" : "off");
      } catch {
        setState("off");
      }
    })();
  }, []);

  async function enable() {
    if (!supabase) return;
    setState("busy");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        alert("로그인 후 켤 수 있어요.");
        setState("off");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        alert("푸시 키가 아직 설정되지 않았어요.");
        setState("off");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const j = sub.toJSON() as any;
      await supabase.from("push_subscriptions").upsert({
        endpoint: sub.endpoint,
        user_id: session.user.id,
        p256dh: j.keys.p256dh,
        auth: j.keys.auth,
      });
      setState("on");
    } catch {
      setState("off");
    }
  }

  if (state === "loading") return null;

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", marginTop: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>📲 푸시 알림 {state === "on" ? "켜짐" : "받기"}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 3, lineHeight: 1.5 }}>
          {state === "unsupported"
            ? "이 브라우저는 푸시를 지원하지 않아요 (아이폰은 홈 화면에 추가 후 가능)"
            : state === "denied"
            ? "알림이 차단돼 있어요 — 브라우저 설정에서 이 사이트의 알림을 허용해주세요"
            : state === "on"
            ? "앱을 안 열어도 선정·채팅·포인트 알림이 폰으로 와요"
            : "켜두면 앱을 안 열어도 선정·채팅 알림이 폰 상단에 떠요"}
        </div>
      </div>
      {(state === "off" || state === "busy") && (
        <button className="btn pri" style={{ padding: "10px 18px", fontSize: 13, flexShrink: 0 }} onClick={enable} disabled={state === "busy"}>
          {state === "busy" ? "설정 중…" : "알림 켜기"}
        </button>
      )}
      {state === "on" && <span style={{ fontSize: 13, fontWeight: 900, color: "#1FA45B", flexShrink: 0 }}>✓ 사용 중</span>}
    </div>
  );
}
