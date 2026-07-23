"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";

const ADMIN_EMAIL = "admin@jmgroup.kr";

type Row = {
  id: string;
  tag: string;
  title: string;
  sub: string;
  href: string;
  bg: string;
  art: string;
  dark: boolean;
  sort: number;
  active: boolean;
};

const BG_PRESETS = [
  { label: "주황 (브랜드)", bg: "linear-gradient(115deg,#FF7A45,#F04E1A)", dark: true },
  { label: "다크 브라운", bg: "linear-gradient(115deg,#2A2118,#4A3520)", dark: true },
  { label: "크림 (밝음)", bg: "linear-gradient(115deg,#FFF3E7,#FFE3CC)", dark: false },
  { label: "그린", bg: "linear-gradient(115deg,#1FA45B,#0E7A3E)", dark: true },
  { label: "블루", bg: "linear-gradient(115deg,#3B82F6,#1D4ED8)", dark: true },
];
const ARTS = [
  { v: "pin", label: "논라 핀" },
  { v: "coin", label: "동전 0đ" },
  { v: "mega", label: "확성기" },
  { v: "none", label: "없음" },
];

const inp: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--line)",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13.5,
  fontFamily: "inherit",
  outline: "none",
  background: "#fff",
};
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 800, margin: "10px 0 4px", color: "var(--ink2)" };

export default function AdminBannersPage() {
  const supabase = getSupabase();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from("banners").select("*").order("sort", { ascending: true });
    setRows((data as Row[]) ?? []);
  }

  useEffect(() => {
    if (!supabase) {
      setAllowed(false);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ok = session?.user?.email === ADMIN_EMAIL;
      setAllowed(ok);
      if (ok) load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function patch(id: string, p: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  }

  async function save(r: Row) {
    if (!supabase) return;
    setBusy(r.id);
    setMsg("");
    const { id, ...vals } = r;
    const { error } = await supabase.from("banners").update(vals).eq("id", id);
    setBusy(null);
    setMsg(error ? "저장 실패: " + error.message : "저장됐어요. 홈에는 1분 안에 반영됩니다.");
  }

  async function add() {
    if (!supabase) return;
    setBusy("new");
    const { error } = await supabase.from("banners").insert({
      tag: "공지",
      title: "새 배너 제목\n두 번째 줄",
      sub: "설명 문구",
      href: "#campaigns",
      bg: BG_PRESETS[0].bg,
      art: "pin",
      dark: true,
      sort: (rows[rows.length - 1]?.sort ?? 0) + 1,
      active: false,
    });
    setBusy(null);
    if (error) setMsg("추가 실패: " + error.message);
    else load();
  }

  async function remove(id: string) {
    if (!supabase) return;
    setBusy(id);
    const { error } = await supabase.from("banners").delete().eq("id", id);
    setBusy(null);
    if (error) setMsg("삭제 실패: " + error.message);
    else setRows((rs) => rs.filter((r) => r.id !== id));
  }

  if (allowed === null) return <div className="wrap" style={{ paddingTop: 40, color: "var(--ink3)" }}>확인 중…</div>;
  if (!allowed)
    return (
      <div className="wrap" style={{ maxWidth: 560, paddingTop: 40 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900 }}>운영자 전용 페이지예요</h1>
        <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 8 }}>
          운영자 계정({ADMIN_EMAIL})으로 로그인하면 홈 배너를 관리할 수 있어요.
        </p>
        <Link className="btn pri" style={{ marginTop: 16, padding: "12px 22px" }} href="/login">
          로그인하기
        </Link>
      </div>
    );

  return (
    <div className="wrap" style={{ maxWidth: 680, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/me" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 마이
      </Link>
      <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>홈 배너 관리</h1>
          <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
            문구·이동 링크·색을 바꾸고 저장하면 홈에 바로 반영돼요 (최대 1분)
          </div>
        </div>
        <button className="btn pri" style={{ marginLeft: "auto", padding: "10px 16px", fontSize: 13 }} onClick={add} disabled={busy === "new"}>
          + 배너 추가
        </button>
      </div>

      {msg && (
        <div style={{ marginTop: 12, background: "var(--chip)", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>
          {msg}
        </div>
      )}

      {rows.map((r, idx) => (
        <div key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 16, marginTop: 16, padding: "16px 18px", opacity: r.active ? 1 : 0.65 }}>
          {/* 미리보기 */}
          <div style={{ borderRadius: 12, background: r.bg, padding: "14px 16px", color: r.dark ? "#fff" : "var(--ink)" }}>
            <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 0.5, borderRadius: 5, padding: "2px 7px", background: r.dark ? "rgba(255,255,255,.18)" : "rgba(240,78,26,.12)", color: r.dark ? "#fff" : "var(--brand-dark)" }}>
              {r.tag}
            </span>
            <div style={{ marginTop: 5, fontSize: 15, fontWeight: 900, lineHeight: 1.3, whiteSpace: "pre-line" }}>{r.title}</div>
            <div style={{ marginTop: 3, fontSize: 11, opacity: 0.8 }}>{r.sub}</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>말머리 태그</label>
              <input style={inp} value={r.tag} onChange={(e) => patch(r.id, { tag: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>순서 (낮을수록 먼저)</label>
              <input style={inp} type="number" value={r.sort} onChange={(e) => patch(r.id, { sort: Number(e.target.value) })} />
            </div>
          </div>

          <label style={lbl}>제목 (엔터로 줄바꿈)</label>
          <textarea style={{ ...inp, minHeight: 54, resize: "vertical" }} value={r.title} onChange={(e) => patch(r.id, { title: e.target.value })} />

          <label style={lbl}>설명 문구</label>
          <input style={inp} value={r.sub} onChange={(e) => patch(r.id, { sub: e.target.value })} />

          <label style={lbl}>누르면 이동할 곳 (예: /partner, /campaign?id=..., #campaigns, https://...)</label>
          <input style={inp} value={r.href} onChange={(e) => patch(r.id, { href: e.target.value })} />

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>배경색</label>
              <select
                style={inp}
                value={r.bg}
                onChange={(e) => {
                  const p = BG_PRESETS.find((x) => x.bg === e.target.value);
                  patch(r.id, { bg: e.target.value, dark: p ? p.dark : r.dark });
                }}
              >
                {BG_PRESETS.map((p) => (
                  <option key={p.label} value={p.bg}>
                    {p.label}
                  </option>
                ))}
                {!BG_PRESETS.some((p) => p.bg === r.bg) && <option value={r.bg}>사용자 지정</option>}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>그림</label>
              <select style={inp} value={r.art} onChange={(e) => patch(r.id, { art: e.target.value })}>
                {ARTS.map((a) => (
                  <option key={a.v} value={a.v}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              <input type="checkbox" checked={r.active} onChange={(e) => patch(r.id, { active: e.target.checked })} style={{ width: 17, height: 17 }} />
              노출 중
            </label>
            <button className="btn pri" style={{ marginLeft: "auto", padding: "10px 18px", fontSize: 13 }} onClick={() => save(r)} disabled={busy === r.id}>
              {busy === r.id ? "저장 중…" : "저장"}
            </button>
            <button
              className="btn ghost"
              style={{ padding: "10px 14px", fontSize: 13, color: "#C0392B" }}
              onClick={() => {
                if (confirm(`${idx + 1}번 배너를 삭제할까요?`)) remove(r.id);
              }}
              disabled={busy === r.id}
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
