"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";
import { useLang, LangToggle, mkT } from "../../../lib/i18n";

/* 사장님 → 단골에게 소식 보내기 (푸시+알림, 하루 1번) */

const VI: Record<string, string> = {
  "← 사장님 센터": "← Trung tâm đối tác",
  "단골 소식 보내기": "Gửi tin cho khách quen",
  "단골을 맺은 손님들에게 새 쿠폰·이벤트·새 메뉴 소식을 알림으로 보내요. 하루에 1번 보낼 수 있어요.": "Gửi thông báo coupon mới, sự kiện, món mới cho khách quen. Mỗi ngày gửi được 1 lần.",
  "업체 선택": "Chọn cửa hàng",
  "먼저 업체를 등록해주세요.": "Vui lòng đăng ký cửa hàng trước.",
  "단골": "Khách quen",
  "명": "người",
  "예: 이번 주 단골 손님께 음료 1잔 서비스! 새 쿠폰도 받아가세요 :)": "VD: Tuần này tặng khách quen 1 đồ uống! Nhận coupon mới nhé :)",
  "보내기": "Gửi",
  "보내는 중…": "Đang gửi…",
  "보낸 소식": "Tin đã gửi",
  "아직 보낸 소식이 없어요.": "Chưa có tin nào.",
  "명에게 전송됨": "người đã nhận",
  "로그인 후 이용할 수 있어요.": "Vui lòng đăng nhập.",
  "로그인하기": "Đăng nhập",
};

type MyPlace = { id: string; name: string };
type Notice = { id: string; body: string; sent_to: number; created_at: string };

export default function OwnerNoticePage() {
  const supabase = getSupabase();
  const [lang, setLang] = useLang();
  const t = mkT(lang, VI);
  const [guest, setGuest] = useState(false);
  const [places, setPlaces] = useState<MyPlace[]>([]);
  const [placeId, setPlaceId] = useState("");
  const [fanN, setFanN] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);

  async function loadPlaceInfo(pid: string) {
    if (!supabase || !pid) return;
    const [{ data: fc }, { data: ns }] = await Promise.all([
      supabase.rpc("fan_count", { p_place: pid }),
      supabase.from("place_notices").select("id, body, sent_to, created_at").eq("place_id", pid).order("created_at", { ascending: false }).limit(20),
    ]);
    setFanN(typeof fc === "number" ? fc : 0);
    setNotices((ns as Notice[]) ?? []);
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
      const { data } = await supabase.from("places").select("id, name").eq("owner_id", session.user.id).order("created_at");
      const list = (data as MyPlace[]) ?? [];
      setPlaces(list);
      if (list.length) {
        setPlaceId(list[0].id);
        loadPlaceInfo(list[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function send() {
    if (!supabase || !placeId || !body.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.rpc("owner_notify_fans", { p_place: placeId, p_body: body.trim() });
    setBusy(false);
    if (error) {
      setMsg({ t: error.message, ok: false });
    } else {
      setMsg({ t: (typeof data === "number" ? data : 0) + t("명에게 전송됨"), ok: true });
      setBody("");
      loadPlaceInfo(placeId);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 560, paddingTop: 22, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link href="/owner" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
          {t("← 사장님 센터")}
        </Link>
        <span style={{ marginLeft: "auto" }}>
          <LangToggle lang={lang} setLang={setLang} />
        </span>
      </div>
      <h1 style={{ fontSize: 21, fontWeight: 900, marginTop: 12 }}>{t("단골 소식 보내기")}</h1>
      <p style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 5, lineHeight: 1.6 }}>
        {t("단골을 맺은 손님들에게 새 쿠폰·이벤트·새 메뉴 소식을 알림으로 보내요. 하루에 1번 보낼 수 있어요.")}
      </p>

      {guest ? (
        <div style={{ marginTop: 26, textAlign: "center" }}>
          <div className="notice info">{t("로그인 후 이용할 수 있어요.")}</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "12px 26px" }} href="/login">
            {t("로그인하기")}
          </Link>
        </div>
      ) : places.length === 0 ? (
        <div className="notice info" style={{ marginTop: 20 }}>
          {t("먼저 업체를 등록해주세요.")}
        </div>
      ) : (
        <>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 800, margin: "16px 0 6px" }}>{t("업체 선택")}</label>
          <select
            value={placeId}
            onChange={(e) => {
              setPlaceId(e.target.value);
              loadPlaceInfo(e.target.value);
            }}
            style={{ width: "100%", border: "1.5px solid var(--line)", borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", background: "#fff" }}
          >
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {fanN !== null && (
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--brand-dark)", marginTop: 8 }}>
              {t("단골")} {fanN}
              {t("명")}
            </div>
          )}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={200}
            rows={4}
            placeholder={t("예: 이번 주 단골 손님께 음료 1잔 서비스! 새 쿠폰도 받아가세요 :)")}
            style={{ width: "100%", border: "1.5px solid var(--line)", borderRadius: 14, padding: "13px 15px", fontSize: 14, fontFamily: "inherit", outline: "none", marginTop: 12, resize: "vertical" }}
          />
          <button className="btn pri" style={{ width: "100%", marginTop: 10, padding: "14px 0", fontSize: 15 }} disabled={busy || !body.trim()} onClick={send}>
            {busy ? t("보내는 중…") : t("보내기")}
          </button>
          {msg && (
            <div className={"notice " + (msg.ok ? "ok" : "warn")} style={{ marginTop: 12 }}>
              {msg.t}
            </div>
          )}

          <h2 style={{ fontSize: 15.5, fontWeight: 900, marginTop: 28 }}>{t("보낸 소식")}</h2>
          {notices.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 10 }}>{t("아직 보낸 소식이 없어요.")}</div>
          ) : (
            notices.map((n) => (
              <div key={n.id} style={{ borderBottom: "1px solid var(--line)", padding: "12px 2px" }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString("ko-KR")} · {n.sent_to}
                  {t("명에게 전송됨")}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
