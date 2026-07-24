"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { playChime, initChime } from "../lib/chime";
import { initNativePush } from "../lib/nativePush";
import { useLang } from "../lib/i18n";

const TABS = [
  { href: "/", label: "홈", vi: "Trang chủ", icon: "home" },
  { href: "/map", label: "지도", vi: "Bản đồ", icon: "map" },
  { href: "/search", label: "검색", vi: "Tìm", icon: "search" },
  { href: "/chat", label: "채팅", vi: "Chat", icon: "chat" },
  { href: "/me", label: "마이", vi: "Của tôi", icon: "user" },
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
  const [chatUnread, setChatUnread] = useState<number>(0);
  const [suspended, setSuspended] = useState(false);
  const [lang] = useLang();
  const supabase = getSupabase();
  // 채팅방에서는 탭바 숨김 (입력창이 화면 맨 아래 붙게)
  const hideTab = pathname?.startsWith("/chatroom") || pathname?.startsWith("/dm");
  useEffect(() => {
    document.body.classList.toggle("no-tabbar", !!hideTab);
    return () => document.body.classList.remove("no-tabbar");
  }, [hideTab]);
  useEffect(() => {
    initChime(); // 첫 터치 때 오디오 잠금 해제 (모바일 자동재생 정책)
    if (!supabase) return;
    let timer: ReturnType<typeof setInterval>;
    let ch: any = null;
    let deb: ReturnType<typeof setTimeout> | null = null;
    let dead = false;
    let curSession: any = null;
    function refreshChatUnread() {
      if (deb) clearTimeout(deb);
      deb = setTimeout(async () => {
        const { data: cu } = await supabase!.rpc("unread_msg_count");
        setChatUnread(typeof cu === "number" ? cu : 0);
      }, 400);
    }
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
      const { data: cu } = await supabase!.rpc("unread_msg_count");
      setChatUnread(typeof cu === "number" ? cu : 0);
    }
    (async () => {
      const {
        data: { session },
      } = await supabase!.auth.getSession();
      poll(true);
      if (session) {
        initNativePush(supabase!); // APK 안에서만 동작 (FCM 토큰 등록)
        supabase!
          .from("profiles")
          .select("suspended")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => setSuspended(!!(data as any)?.suspended));
        // 실시간: 새 알림 도착 즉시 뱃지+소리 (연결 끊기면 자동 재구독)
        subscribeRT(session);
      }
    })();
    function subscribeRT(session: any) {
      if (dead) return;
      curSession = session;
      if (ch) {
        try {
          supabase!.removeChannel(ch);
        } catch {}
        ch = null;
      }
      const inst = supabase!
        .channel("notif-rt-" + session.user.id + "-" + Math.floor(Math.random() * 1e9))
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + session.user.id },
          () => {
            setUnread((u) => (u ?? 0) + 1);
            playChime();
          }
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload: any) => {
          // 즉시 반영(+1) 후 서버값으로 보정
          if (payload?.eventType === "INSERT" && payload?.new?.sender_id && payload.new.sender_id !== session.user.id) {
            setChatUnread((u) => u + 1);
            playChime();
          }
          refreshChatUnread();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages" }, (payload: any) => {
          if (payload?.eventType === "INSERT" && payload?.new?.sender_id && payload.new.sender_id !== session.user.id) {
            setChatUnread((u) => u + 1);
            playChime();
          }
          refreshChatUnread();
        });
      ch = inst;
      inst.subscribe((status: string) => {
        if (dead || ch !== inst) return;
        // 웹소켓이 끊기거나 타임아웃되면 3초 후 재구독 (소리/뱃지 실시간 유지)
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setTimeout(() => {
            if (!dead && ch === inst) subscribeRT(session);
          }, 3000);
        }
      });
    }
    // 앱을 다시 앞으로 가져오면(화면 복귀) 연결이 죽어있을 수 있으니 뱃지 갱신 + 재구독
    const onVis = () => {
      if (document.hidden) return;
      poll(true);
      if (curSession) subscribeRT(curSession);
    };
    document.addEventListener("visibilitychange", onVis);
    timer = setInterval(() => poll(true), 60000); // 안전망 (소리는 실시간에서만)
    return () => {
      dead = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      if (ch) supabase!.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);
  const banner = suspended ? (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 990,
        background: "#C0392B",
        color: "#fff",
        fontSize: 12,
        fontWeight: 800,
        textAlign: "center",
        padding: "9px 14px",
      }}
    >
      ⛔ 신고 누적으로 계정이 일시 정지됐어요 · 문의: 고객센터 1666-0464
    </div>
  ) : null;

  if (hideTab) return banner;
  return (
    <>
      {banner}
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
          {lang === "vi" ? t.vi : t.label}
          {t.href === "/me" && (unread ?? 0) > 0 && (
            <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", width: 8, height: 8, borderRadius: "50%", background: "var(--brand)" }} />
          )}
          {t.href === "/chat" && chatUnread > 0 && (
            <span
              style={{
                position: "absolute",
                top: 3,
                right: "calc(50% - 22px)",
                minWidth: 17,
                height: 17,
                borderRadius: 999,
                background: "#E0483E",
                color: "#fff",
                fontSize: 10,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                boxShadow: "0 1px 4px rgba(200,40,30,.4)",
              }}
            >
              {chatUnread > 99 ? "99+" : chatUnread}
            </span>
          )}
        </Link>
      ))}
    </nav>
    </>
  );
}
