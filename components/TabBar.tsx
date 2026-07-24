"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { playChime, initChime } from "../lib/chime";
import { initNativePush } from "../lib/nativePush";

const TABS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/map", label: "지도", icon: "map" },
  { href: "/search", label: "검색", icon: "search" },
  { href: "/chat", label: "채팅", icon: "chat" },
  { href: "/me", label: "마이", icon: "user" },
];

function Icon({ name }: { name: string }) {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "file":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "map":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M20.8 9.6c0 5-8.8 12.4-8.8 12.4S3.2 14.6 3.2 9.6a8.8 8.8 0 1 1 17.6 0Z" />
          <circle cx="12" cy="9.6" r="3.1" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case "store":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M3 9l1.5-5h15L21 9" />
          <path d="M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
  }
}

export default function TabBar() {
  const pathname = usePathname();
  const [unread, setUnread] = useState<number | null>(null);
  const supabase = getSupabase();
  useEffect(() => {
    initChime(); // 첫 터치 때 오디오 잠금 해제 (모바일 자동재생 정책)
    if (!supabase) return;
    let timer: ReturnType<typeof setInterval>;
    let ch: any = null;
    async function poll(silent = false) {
      const {
        data: { session },
      } = await supabase!.auth.getSession();
      if (!session) {
        setUnread(null);
        return;
      }
      const { count } = await supabase!
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
      setUnread((prev) => {
        const next = count ?? 0;
        if (!silent && prev !== null && next > prev) playChime();
        return next;
      });
    }
    (async () => {
      const {
        data: { session },
      } = await supabase!.auth.getSession();
      poll(true);
      if (session) {
        initNativePush(supabase!); // APK 안에서만 동작 (FCM 토큰 등록)
        // 실시간: 새 알림 도착 즉시 뱃지+소리
        ch = supabase!
          .channel("notif-rt-" + session.user.id)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + session.user.id },
            () => {
              setUnread((u) => (u ?? 0) + 1);
              playChime();
            }
          )
          .subscribe();
      }
    })();
    timer = setInterval(() => poll(true), 60000); // 안전망 (소리는 실시간에서만)
    return () => {
      clearInterval(timer);
      if (ch) supabase!.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);
  return (
    <nav className="tabbar-app">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={"ti" + (pathname === t.href ? " on" : "") + (t.icon === "search" ? " tsearch" : "")}
          style={{ position: "relative" }}
        >
          {t.icon === "search" ? (
            <span className="bub">
              <Icon name="search" />
            </span>
          ) : (
            <Icon name={t.icon} />
          )}
          {t.label}
          {t.href === "/me" && (unread ?? 0) > 0 && (
            <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", width: 8, height: 8, borderRadius: "50%", background: "var(--brand)" }} />
          )}
        </Link>
      ))}
    </nav>
  );
}
