"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabase";
import { playChime } from "../lib/chime";

export default function NotificationBell() {
  const supabase = getSupabase();
  const [count, setCount] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let timer: ReturnType<typeof setInterval>;
    async function poll() {
      const {
        data: { session },
      } = await supabase!.auth.getSession();
      if (!session) {
        setLoggedIn(false);
        setCount(null);
        return;
      }
      setLoggedIn(true);
      const { count: n } = await supabase!
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
      setCount((prev) => {
        const next = n ?? 0;
        if (prev !== null && next > prev) playChime();
        return next;
      });
    }
    poll();
    timer = setInterval(poll, 30000);
    return () => clearInterval(timer);
  }, [supabase]);

  if (!loggedIn) return null;

  return (
    <Link
      href="/notifications"
      aria-label="알림"
      style={{
        position: "relative",
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: "var(--chip)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {(count ?? 0) > 0 && (
        <span
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            minWidth: 17,
            height: 17,
            borderRadius: 9,
            background: "var(--brand)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          }}
        >
          {(count ?? 0) > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
