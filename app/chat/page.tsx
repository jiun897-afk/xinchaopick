"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import Avatar from "../../components/Avatar";

type Room = {
  id: string;
  user_id: string;
  status: string;
  campaigns: { store_name: string; owner_id: string; image_url: string | null } | null;
  role: "reviewer" | "owner";
};

type DmRoom = { id: string; partner: string; avatar?: string | null };

export default function ChatListPage() {
  const supabase = getSupabase();
  const [guest, setGuest] = useState(false);
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [dms, setDms] = useState<DmRoom[]>([]);
  const [friends, setFriends] = useState<{ id: string; nickname: string; handle: string | null; avatar_url?: string | null }[]>([]);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ id: string; nickname: string; handle: string; avatar_url?: string | null } | null | "none">(null);
  const [sBusy, setSBusy] = useState(false);
  const [tab, setTab] = useState<"chats" | "friends">("chats");

  async function searchHandle() {
    if (!supabase) return;
    if (q.trim().length < 4) {
      setFound("none");
      return;
    }
    setSBusy(true);
    setFound(null);
    const { data } = await supabase.rpc("find_by_handle", { p_handle: q });
    const row = Array.isArray(data) ? data[0] : data;
    setFound(row ?? "none");
    setSBusy(false);
  }

  async function startChat(otherId: string) {
    if (!supabase) return;
    const { data, error } = await supabase.rpc("start_dm", { p_other: otherId });
    if (error) alert(error.message);
    else window.location.href = "/dm?id=" + data;
  }

  async function addFriend(otherId: string) {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("friends").insert({ user_id: session.user.id, friend_id: otherId });
    setFriends((f) => (f.some((x) => x.id === otherId) ? f : [...f, { id: otherId, nickname: (found as any)?.nickname ?? "회원", handle: (found as any)?.handle ?? null }]));
  }

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

      // 1:1 채팅방 + 친구 목록 (동시 조회로 속도 개선)
      const [{ data: dr }, { data: fr }] = await Promise.all([
        supabase.from("dm_rooms").select("id, user_a, user_b").order("created_at", { ascending: false }),
        supabase.from("friends").select("friend_id").eq("user_id", me),
      ]);
      const drs = (dr as any[]) ?? [];
      const fids = ((fr as any[]) ?? []).map((x) => x.friend_id);
      const needIds = Array.from(new Set([...drs.map((r) => (r.user_a === me ? r.user_b : r.user_a)), ...fids]));
      if (needIds.length) {
        const { data: profs } = await supabase.rpc("profiles_view", { p_ids: needIds });
        const nm: Record<string, any> = {};
        ((profs as any[]) ?? []).forEach((p: any) => (nm[p.id] = p));
        setDms(drs.map((r) => {
          const oid = r.user_a === me ? r.user_b : r.user_a;
          return { id: r.id, partner: nm[oid]?.nickname ?? "회원", avatar: nm[oid]?.avatar_url ?? null };
        }));
        setFriends(fids.map((id) => ({ id, nickname: nm[id]?.nickname ?? "회원", handle: nm[id]?.handle ?? null, avatar_url: nm[id]?.avatar_url ?? null })));
      }
    })();
  }, [supabase]);

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>채팅</h1>
        <Link
          href="/my-id"
          aria-label="내 아이디 · QR"
          style={{
            marginLeft: "auto",
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <path d="M14 14h3v3h-3zM19 19h2M14 20h2M21 14v2" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
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

      {!guest && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {(
            [
              { k: "chats", label: "채팅" },
              { k: "friends", label: "친구" + (friends.length ? " " + friends.length : "") },
            ] as const
          ).map((t) => (
            <span
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 0",
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 900,
                cursor: "pointer",
                background: tab === t.k ? "var(--ink)" : "var(--chip)",
                color: tab === t.k ? "#fff" : "var(--ink2)",
              }}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}

      {!guest && tab === "friends" && (
        <>
          {/* 아이디 검색 (아이디를 아는 사람만 채팅 시작 가능) */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <input
              style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--line)", borderRadius: 999, padding: "11px 16px", fontSize: 13.5, fontFamily: "inherit", outline: "none" }}
              placeholder="상대 아이디로 검색 (예: veja_kim)"
              value={q}
              onChange={(e) => setQ(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && searchHandle()}
            />
            <button className="btn pri" style={{ padding: "0 18px", borderRadius: 999, fontSize: 13 }} disabled={sBusy} onClick={searchHandle}>
              검색
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 6 }}>
            아이디를 아는 사람끼리만 1:1 채팅이 돼요 · 내 QR은 우측 상단 버튼
          </div>
          {found === "none" && <div className="notice info" style={{ marginTop: 10 }}>그 아이디의 회원이 없어요.</div>}
          {found && found !== "none" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid var(--brand)", background: "var(--brand-bg)", borderRadius: 14, padding: "12px 14px", marginTop: 10 }}>
              <Avatar url={found.avatar_url} name={found.nickname} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{found.nickname}</div>
                <div style={{ fontSize: 11, color: "var(--ink3)" }}>@{found.handle}</div>
              </div>
              <button className="btn ghost" style={{ padding: "8px 12px", fontSize: 11.5 }} onClick={() => addFriend(found.id)}>
                ＋ 친구
              </button>
              <button className="btn pri" style={{ padding: "8px 14px", fontSize: 12 }} onClick={() => startChat(found.id)}>
                💬 채팅
              </button>
            </div>
          )}

          {/* 친구 리스트 (세로) */}
          <div style={{ fontSize: 12, fontWeight: 900, color: "var(--ink3)", marginTop: 20 }}>친구 {friends.length}</div>
          {friends.length === 0 && (
            <div style={{ marginTop: 12, textAlign: "center", padding: "24px 0", fontSize: 13, color: "var(--ink3)", lineHeight: 1.8 }}>
              아직 친구가 없어요.
              <br />
              위에서 아이디로 검색하거나, 상대 QR을 찍어 추가해보세요!
            </div>
          )}
          {friends.map((f) => (
            <div
              key={f.id}
              style={{ display: "flex", gap: 12, alignItems: "center", borderBottom: "1px solid var(--line)", padding: "13px 2px" }}
            >
              <Avatar url={f.avatar_url} name={f.nickname} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800 }}>{f.nickname}</div>
                {f.handle && <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 2 }}>@{f.handle}</div>}
              </div>
              <button className="btn pri" style={{ padding: "9px 15px", fontSize: 12.5 }} onClick={() => startChat(f.id)}>
                💬 채팅
              </button>
            </div>
          ))}
        </>
      )}

      {!guest && tab === "chats" && (
        <>
          {/* 1:1 채팅방 목록 */}
          {dms.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--ink3)", marginTop: 18 }}>1:1 채팅</div>
              {dms.map((d) => (
                <Link
                  key={d.id}
                  href={"/dm?id=" + d.id}
                  style={{ display: "flex", gap: 13, alignItems: "center", border: "1px solid var(--line)", borderRadius: 16, padding: "13px 16px", marginTop: 10 }}
                >
                  <Avatar url={d.avatar} name={d.partner} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{d.partner}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 3 }}>1:1 대화</div>
                  </div>
                  <span style={{ color: "var(--ink3)" }}>›</span>
                </Link>
              ))}
            </>
          )}
        </>
      )}

      {!guest && tab === "chats" && rooms === null && <div style={{ marginTop: 24, fontSize: 14, color: "var(--ink3)" }}>불러오는 중…</div>}

      {!guest && tab === "chats" && rooms !== null && rooms.length === 0 && dms.length === 0 && (
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

      {!guest && tab === "chats" && (rooms ?? []).length > 0 && (
        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--ink3)", marginTop: 18 }}>캠페인 채팅</div>
      )}
      {!guest &&
        tab === "chats" &&
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
