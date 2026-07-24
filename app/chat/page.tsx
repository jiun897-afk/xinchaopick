"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import Avatar from "../../components/Avatar";

type ChatRoom = {
  kind: "camp" | "dm";
  rid: string;
  title: string;
  image: string | null;
  last_msg: string | null;
  last_at: string;
  unread: number;
};

function fmtTime(s: string) {
  const d = new Date(s);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  return d.getMonth() + 1 + "/" + d.getDate();
}

export default function ChatListPage() {
  const supabase = getSupabase();
  const [guest, setGuest] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[] | null>(null);
  const [friends, setFriends] = useState<{ id: string; nickname: string; handle: string | null; avatar_url?: string | null }[]>([]);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ id: string; nickname: string; handle: string; avatar_url?: string | null } | null | "none">(null);
  const [sBusy, setSBusy] = useState(false);
  const [tab, setTab] = useState<"dm" | "camp" | "friends">("dm");
  const longRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const [{ data: cr }, { data: fr }] = await Promise.all([
        supabase.rpc("chat_rooms"),
        supabase.from("friends").select("friend_id").eq("user_id", me),
      ]);
      setChatRooms(((cr as ChatRoom[]) ?? []));
      const fids = ((fr as any[]) ?? []).map((x) => x.friend_id);
      if (fids.length) {
        const { data: pv } = await supabase.rpc("profiles_view", { p_ids: fids });
        const nm: Record<string, any> = {};
        ((pv as any[]) ?? []).forEach((p) => (nm[p.id] = p));
        setFriends(fids.map((id) => ({ id, nickname: nm[id]?.nickname ?? "회원", handle: nm[id]?.handle ?? null, avatar_url: nm[id]?.avatar_url ?? null })));
      }
    })();
  }, [supabase]);

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
    setFriends((f) =>
      f.some((x) => x.id === otherId)
        ? f
        : [...f, { id: otherId, nickname: (found as any)?.nickname ?? "회원", handle: (found as any)?.handle ?? null, avatar_url: (found as any)?.avatar_url ?? null }]
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>채팅</h1>
        <Link
          href="/my-id"
          aria-label="내 아이디 · QR"
          style={{ marginLeft: "auto", width: 40, height: 40, borderRadius: 12, border: "1px solid var(--line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <path d="M14 14h3v3h-3zM19 19h2M14 20h2M21 14v2" strokeLinecap="round" />
          </svg>
        </Link>
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
              { k: "dm", label: "채팅" },
              { k: "camp", label: "캠페인" },
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

      {/* ── 친구 탭 ── */}
      {!guest && tab === "friends" && (
        <>
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
              onPointerDown={() => {
                longRef.current = setTimeout(async () => {
                  if (!supabase) return;
                  if (confirm(f.nickname + "님을 친구에서 삭제할까요?")) {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    if (session) {
                      await supabase.from("friends").delete().eq("user_id", session.user.id).eq("friend_id", f.id);
                      setFriends((l) => l.filter((x) => x.id !== f.id));
                    }
                  }
                }, 600);
              }}
              onPointerUp={() => longRef.current && clearTimeout(longRef.current)}
              onPointerMove={() => longRef.current && clearTimeout(longRef.current)}
              onPointerLeave={() => longRef.current && clearTimeout(longRef.current)}
              onContextMenu={(e) => e.preventDefault()}
              style={{ display: "flex", gap: 12, alignItems: "center", borderBottom: "1px solid var(--line)", padding: "13px 2px", touchAction: "pan-y", userSelect: "none", WebkitUserSelect: "none" }}
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

      {/* ── 채팅 목록: 최신 메시지순 (좌: 1:1 / 우: 업체) ── */}
      {!guest && (tab === "dm" || tab === "camp") && (
        <>
          {chatRooms === null && <div style={{ marginTop: 24, fontSize: 14, color: "var(--ink3)" }}>불러오는 중…</div>}
          {chatRooms !== null && chatRooms.filter((r) => r.kind === tab).length === 0 && (
            <div style={{ marginTop: 30, textAlign: "center", padding: "30px 0" }}>
              <div style={{ fontSize: 15.5, fontWeight: 800 }}>
                {tab === "camp" ? "아직 캠페인 채팅이 없어요" : "아직 1:1 채팅이 없어요"}
              </div>
              <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 8, lineHeight: 1.7 }}>
                {tab === "camp" ? (
                  <>캠페인에 선정되면 사장님과의 채팅방이 자동으로 열려요.</>
                ) : (
                  <>친구 탭에서 아이디 검색이나 QR로 대화를 시작해보세요.</>
                )}
              </p>
              <Link className="btn pri" style={{ marginTop: 14, padding: "12px 22px" }} href={tab === "camp" ? "/" : "#"} onClick={(e) => { if (tab !== "camp") { e.preventDefault(); setTab("friends"); } }}>
                {tab === "camp" ? "체험단 둘러보기" : "친구 탭으로"}
              </Link>
            </div>
          )}
          {(chatRooms ?? []).filter((r) => r.kind === tab).map((r) => (
            <Link
              key={r.kind + r.rid}
              href={(r.kind === "camp" ? "/chatroom?id=" : "/dm?id=") + r.rid}
              style={{ display: "flex", gap: 12, alignItems: "center", borderBottom: "1px solid var(--line)", padding: "14px 2px" }}
            >
              {r.kind === "camp" ? (
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 13,
                    backgroundColor: "var(--chip)",
                    backgroundImage: r.image ? "url(" + r.image + ")" : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Avatar url={r.image} name={r.title} size={50} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.last_msg ?? "대화를 시작해보세요"}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10.5, color: "var(--ink3)" }}>{fmtTime(r.last_at)}</div>
                {r.unread > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 18,
                      height: 18,
                      borderRadius: 999,
                      background: "#E0483E",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 900,
                      padding: "0 5px",
                      marginTop: 4,
                    }}
                  >
                    {r.unread > 99 ? "99+" : r.unread}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
