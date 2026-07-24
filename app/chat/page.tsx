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

type DmRoom = { id: string; partner: string };

export default function ChatListPage() {
  const supabase = getSupabase();
  const [guest, setGuest] = useState(false);
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [dms, setDms] = useState<DmRoom[]>([]);

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

      // 유저 간 1:1 채팅방
      const { data: dr } = await supabase.from("dm_rooms").select("id, user_a, user_b").order("created_at", { ascending: false });
      const drs = (dr as any[]) ?? [];
      if (drs.length) {
        const others = drs.map((r) => (r.user_a === me ? r.user_b : r.user_a));
        const { data: profs } = await supabase.from("profiles").select("id, nickname").in("id", others);
        const nm: Record<string, string> = {};
        (profs ?? []).forEach((p: any) => (nm[p.id] = p.nickname));
        setDms(drs.map((r) => ({ id: r.id, partner: nm[r.user_a === me ? r.user_b : r.user_a] ?? "회원" })));
      }
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

      {!guest && dms.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 900, color: "var(--ink3)", marginTop: 20 }}>1:1 채팅</div>
          {dms.map((d) => (
            <Link
              key={d.id}
              href={"/dm?id=" + d.id}
              style={{ display: "flex", gap: 13, alignItems: "center", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", marginTop: 10 }}
            >
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--brand)", color: "#fff", fontWeight: 900, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {d.partner[0]?.toUpperCase() ?? "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{d.partner}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 3 }}>회원 간 대화</div>
              </div>
              <span style={{ color: "var(--ink3)" }}>›</span>
            </Link>
          ))}
        </>
      )}

      {!guest && rooms !== null && rooms.length === 0 && dms.length === 0 && (
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
