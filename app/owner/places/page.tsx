"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";
import { PLACE_CATS, PLACE_AREAS, PLACE_DEFAULT_IMG } from "../../../lib/placeCats";

type Place = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  area: string;
  address: string;
  maps_url: string;
  phone: string;
  description: string;
  image_url: string | null;
};

const inp: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--line)",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  background: "#fff",
};
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 800, margin: "14px 0 6px" };

const EMPTY = { name: "", category: "음식점", subcategory: "", area: "다낭", address: "", maps_url: "", phone: "", description: "" };

export default function OwnerPlacesPage() {
  const supabase = getSupabase();
  const [guest, setGuest] = useState(false);
  const [list, setList] = useState<Place[] | null>(null);
  const [form, setForm] = useState<typeof EMPTY & { id?: string }>(EMPTY);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setGuest(true);
      return;
    }
    const { data } = await supabase.from("places").select("*").eq("owner_id", session.user.id).order("created_at", { ascending: false });
    setList((data as Place[]) ?? []);
  }

  useEffect(() => {
    if (!supabase) {
      setGuest(true);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function set<K extends keyof typeof EMPTY>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!supabase) return;
    setMsg("");
    if (!form.name.trim()) return setMsg("업체 이름을 입력해주세요.");
    setBusy(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setBusy(false);
      return setMsg("로그인이 필요해요.");
    }
    const vals = {
      name: form.name.trim(),
      category: form.category,
      subcategory: form.subcategory,
      area: form.area,
      address: form.address.trim(),
      maps_url: form.maps_url.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
      image_url: PLACE_DEFAULT_IMG[form.category] ?? PLACE_DEFAULT_IMG["기타"],
    };
    const { error } = form.id
      ? await supabase.from("places").update(vals).eq("id", form.id)
      : await supabase.from("places").insert({ ...vals, owner_id: session.user.id });
    setBusy(false);
    if (error) return setMsg("저장 실패: " + error.message);
    setForm(EMPTY);
    setOpen(false);
    load();
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/owner" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        ← 사장님 센터
      </Link>
      <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>내 업체 관리</h1>
          <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
            업체를 등록하면 업체 목록에 노출되고, 캠페인도 열 수 있어요 (여러 개 등록 가능)
          </div>
        </div>
        <button
          className="btn pri"
          style={{ marginLeft: "auto", padding: "10px 16px", fontSize: 13, flexShrink: 0 }}
          onClick={() => {
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          + 업체 등록
        </button>
      </div>

      {guest && (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "var(--chip)", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>로그인 후 이용할 수 있어요.</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            로그인하기
          </Link>
        </div>
      )}

      {open && (
        <div style={{ border: "2px solid var(--brand)", borderRadius: 16, padding: "16px 18px", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>{form.id ? "업체 수정" : "새 업체 등록"}</div>

          <label style={lbl}>업체 이름</label>
          <input style={inp} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="예: 허벌 스파 다낭" />

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>업종</label>
              <select
                style={inp}
                value={form.category}
                onChange={(e) => {
                  set("category", e.target.value);
                  set("subcategory", "");
                }}
              >
                {Object.keys(PLACE_CATS).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>세부 업종</label>
              <select style={inp} value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
                <option value="">선택 안 함</option>
                {(PLACE_CATS[form.category] ?? []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>지역</label>
              <select style={inp} value={form.area} onChange={(e) => set("area", e.target.value)}>
                {PLACE_AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1.4 }}>
              <label style={lbl}>전화번호 (선택)</label>
              <input style={inp} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+84..." />
            </div>
          </div>

          <label style={lbl}>주소</label>
          <input style={inp} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="예: 123 Võ Nguyên Giáp, Mỹ Khê" />

          <label style={lbl}>구글맵 링크 (지도에서 보기 버튼에 사용)</label>
          <input style={inp} value={form.maps_url} onChange={(e) => set("maps_url", e.target.value)} placeholder="https://maps.app.goo.gl/..." />
          <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>
            구글맵에서 가게 검색 → 공유 → 링크 복사해서 붙여넣으면 돼요
          </div>

          <label style={lbl}>소개 (선택)</label>
          <textarea
            style={{ ...inp, minHeight: 70, resize: "vertical" }}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="가게 소개, 대표 메뉴, 한국어 가능 여부 등"
          />

          {msg && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: "#C0392B" }}>{msg}</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn pri" style={{ flex: 1, padding: "13px 0", fontSize: 14.5 }} onClick={save} disabled={busy}>
              {busy ? "저장 중…" : form.id ? "수정 저장" : "업체 등록하기"}
            </button>
            <button className="btn ghost" style={{ padding: "13px 18px", fontSize: 14 }} onClick={() => setOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {!guest && list !== null && list.length === 0 && !open && (
        <div style={{ marginTop: 26, textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 15.5, fontWeight: 800 }}>아직 등록한 업체가 없어요</div>
          <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 6 }}>업체를 등록해야 캠페인을 열 수 있어요.</p>
        </div>
      )}

      {!guest &&
        (list ?? []).map((p) => (
          <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "center", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", marginTop: 12 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: "var(--chip)",
                backgroundImage: p.image_url ? "url(" + p.image_url + ")" : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 2 }}>
                {p.category}
                {p.subcategory ? " · " + p.subcategory : ""} · {p.area}
              </div>
            </div>
            <Link href={"/place?id=" + p.id} style={{ fontSize: 12, fontWeight: 800, color: "var(--brand-dark)", textDecoration: "underline", flexShrink: 0 }}>
              보기
            </Link>
            <button
              className="btn ghost"
              style={{ padding: "8px 13px", fontSize: 12, flexShrink: 0 }}
              onClick={() => {
                setForm({ ...p, subcategory: p.subcategory ?? "", maps_url: p.maps_url ?? "", phone: p.phone ?? "", description: p.description ?? "", address: p.address ?? "" });
                setOpen(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              수정
            </button>
          </div>
        ))}
    </div>
  );
}
