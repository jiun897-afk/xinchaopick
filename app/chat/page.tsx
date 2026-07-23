"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";

type Room = {
  id: string;
  user_id: string;
  status: string;
  campaigns: { store_name: string; owner_id: string; image_url: string | null } | null;
  role: "reviewer" | "owner";
};

export default function ChatListPage() {
  const supabase = getSupabase();
  const [guest, setGuest] = useState(false);
  const [rooms, setRooms] = useState<Room[] | null>(null);

  useEffect(() => {
    if (!supabase) {
      setGuest(true);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setGuest(true);
        return;
      }
      const me = session.user.id;
      const [{ data: mine }, { data: owned }] = await Promise.all([
        supabase
          .from("applications")
          .select("id, user_id, status, campaigns(store_name, owner_id, image_url)")
          .eq("user_id", me)
          .in("status", ["selected", "completed"]),
        supabase
          .from("applications")
          .select("id, user_id, status, campaigns!inner(store_name, owner_id, image_url)")
          .eq("campaigns.owner_id", me)
          .in("status", ["selected", "completed"]),
      ]);
      const a = ((mine as unknown as Room[]) ?? []).map((r) => ({ ...r, role: "reviewer" as const }));
      const b = ((owned as unknown as Room[]) ?? [])
        .filter((r) => r.user_id !== me)
        .map((r) => ({ ...r, role: "owner" as const }));
      const seen = new Set<string>();
      const all = [...a, ...b].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
      setRooms(all);
    })();
  }, [supabase]);

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>채팅</h1>
      <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
        선정된 캠페인의 사장님·리뷰어와 방문 일정을 조율하세요
      </div>

      {guest && (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "var(--chip)", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>로그인 후 이용할 수 있어요.</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            로그인하기
          </Link>
        </div>
      )}

      {!guest && rooms === null && <div style={{ marginTop: 24, fontSize: 14, color: "var(--ink3)" }}>불러오는 중…</div>}

      {!guest && rooms !== null && rooms.length === 0 && (
        <div style={{ marginTop: 30, textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 15.5, fontWeight: 800 }}>아직 열린 채팅이 없어요</div>
          <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
            캠페인에 선정되면 사장님과의 채팅방이
            <br />
            자동으로 열려요.
          </p>
          <Link className="btn pri" style={{ marginTop: 14, padding: "12px 22px" }} href="/">
            체험단 둘러보기
          </Link>
        </div>
      )}

      {!guest &&
        (rooms ?? []).map((r) => (
          <Link
            key={r.id}
            href={"/chatroom?id=" + r.id}
            style={{ display: "flex", gap: 13, alignItems: "center", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", marginTop: 12 }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: "var(--chip)",
                backgroundImage: r.campaigns?.image_url ? "url(" + r.campaigns.image_url + ")" : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{r.campaigns?.store_name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 3 }}>
                {r.role === "owner" ? "리뷰어와의 대화 (사장님)" : "사장님과의 대화"}
                {r.status === "completed" ? " · 완료된 캠페인" : ""}
              </div>
            </div>
            <span style={{ color: "var(--ink3)" }}>›</span>
          </Link>
        ))}
    </div>
  );
}
