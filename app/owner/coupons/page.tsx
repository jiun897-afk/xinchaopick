"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";
import { useLang, LangToggle, mkT } from "../../../lib/i18n";
import { Coupon, couponTitle, couponCond, couponValid } from "../../../lib/coupon";

const VI: Record<string, string> = {
  "← 사장님 센터": "← Trung tâm đối tác",
  "쿠폰 관리": "Quản lý coupon",
  "체험단이 아니어도 손님이 쿠폰을 보고 찾아와요. \"베자뷰 보고 왔어요\"라고 하면 적용해주세요!": "Khách xem coupon và ghé cửa hàng. Áp dụng khi khách nói \"Tôi thấy trên Vejaview\"!",
  "로그인 후 이용할 수 있어요.": "Vui lòng đăng nhập.",
  "로그인하기": "Đăng nhập",
  "업체 선택": "Chọn cửa hàng",
  "먼저 업체를 등록해주세요.": "Vui lòng đăng ký cửa hàng trước.",
  "새 쿠폰 발행": "Phát hành coupon mới",
  "할인 유형": "Loại ưu đãi",
  "% 할인": "Giảm %",
  "금액 할인": "Giảm tiền",
  "서비스 증정": "Tặng kèm",
  "할인율 (%)": "Tỷ lệ giảm (%)",
  "할인 금액 (₫)": "Số tiền giảm (₫)",
  "증정 내용": "Nội dung tặng",
  "예: 음료 1잔 서비스": "VD: Tặng 1 đồ uống",
  "최소 결제 금액 (₫, 0 = 조건 없음)": "Chi tiêu tối thiểu (₫, 0 = không điều kiện)",
  "특정 메뉴/서비스만 (선택)": "Chỉ áp dụng cho món/dịch vụ (tùy chọn)",
  "예: 아로마 마사지": "VD: Massage aroma",
  "유효기간 (선택)": "Hạn dùng (tùy chọn)",
  "사용 방식": "Cách sử dụng",
  "1인 1회": "1 lần / khách",
  "재사용 가능 (방문마다)": "Dùng lại được (mỗi lần ghé)",
  "수량 한정 (선택, 총 발행 매수 · 비우면 무제한)": "Giới hạn số lượng (tùy chọn · trống = không giới hạn)",
  "재사용": "Dùng lại",
  "한정": "Giới hạn",
  "쿠폰 발행하기": "Phát hành coupon",
  "발행 중…": "Đang phát hành…",
  "값을 입력해주세요.": "Vui lòng nhập giá trị.",
  "발행 실패: ": "Thất bại: ",
  "내 쿠폰": "Coupon của tôi",
  "발행된 쿠폰이 없어요.": "Chưa có coupon nào.",
  "중지": "Dừng",
  "재개": "Bật lại",
  "삭제": "Xóa",
  "중지됨": "Đã dừng",
  "쿠폰을 삭제할까요?": "Xóa coupon này?",
};

type MyPlace = { id: string; name: string };

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

export default function OwnerCouponsPage() {
  const supabase = getSupabase();
  const [lang, setLang] = useLang();
  const t = mkT(lang, VI);
  const [guest, setGuest] = useState(false);
  const [places, setPlaces] = useState<MyPlace[]>([]);
  const [placeId, setPlaceId] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [kind, setKind] = useState<"percent" | "amount" | "gift">("percent");
  const [value, setValue] = useState("");
  const [gift, setGift] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [target, setTarget] = useState("");
  const [expires, setExpires] = useState("");
  const [usage, setUsage] = useState<"once" | "multi">("once");
  const [maxClaims, setMaxClaims] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadCoupons(pid: string) {
    if (!supabase || !pid) return;
    const { data } = await supabase.from("coupons").select("*").eq("place_id", pid).order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) ?? []);
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
      const { data } = await supabase.from("places").select("id, name").eq("owner_id", session.user.id).order("created_at", { ascending: false });
      const pl = (data as MyPlace[]) ?? [];
      setPlaces(pl);
      if (pl[0]) {
        setPlaceId(pl[0].id);
        loadCoupons(pl[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function issue() {
    setMsg("");
    if (!supabase || !placeId) return;
    const v = Number(value.replace(/[^0-9]/g, "")) || 0;
    if (kind !== "gift" && v <= 0) return setMsg(t("값을 입력해주세요."));
    if (kind === "gift" && !gift.trim()) return setMsg(t("값을 입력해주세요."));
    setBusy(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("coupons").insert({
      place_id: placeId,
      owner_id: session.user.id,
      kind,
      value: kind === "gift" ? 0 : kind === "percent" ? Math.min(v, 100) : v,
      gift: kind === "gift" ? gift.trim() : "",
      min_spend: Number(minSpend.replace(/[^0-9]/g, "")) || 0,
      target: target.trim(),
      expires_at: expires || null,
      usage,
      max_claims: Number(maxClaims.replace(/[^0-9]/g, "")) || null,
    });
    setBusy(false);
    if (error) return setMsg(t("발행 실패: ") + error.message);
    setValue("");
    setGift("");
    setMinSpend("");
    setTarget("");
    setExpires("");
    loadCoupons(placeId);
  }

  async function toggleActive(c: Coupon) {
    if (!supabase) return;
    await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    loadCoupons(placeId);
  }

  async function remove(c: Coupon) {
    if (!supabase || !confirm(t("쿠폰을 삭제할까요?"))) return;
    await supabase.from("coupons").delete().eq("id", c.id);
    loadCoupons(placeId);
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link href="/owner" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
          {t("← 사장님 센터")}
        </Link>
        <span style={{ marginLeft: "auto" }}>
          <LangToggle lang={lang} setLang={setLang} />
        </span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>🎟 {t("쿠폰 관리")}</h1>
      <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3, lineHeight: 1.6 }}>
        {t('체험단이 아니어도 손님이 쿠폰을 보고 찾아와요. "베자뷰 보고 왔어요"라고 하면 적용해주세요!')}
      </div>

      {guest ? (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "var(--chip)", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>{t("로그인 후 이용할 수 있어요.")}</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            {t("로그인하기")}
          </Link>
        </div>
      ) : places.length === 0 ? (
        <div style={{ marginTop: 20, background: "var(--brand-bg)", borderRadius: 12, padding: "14px 16px", fontSize: 13.5 }}>
          {t("먼저 업체를 등록해주세요.")}{" "}
          <Link href="/owner/places" style={{ fontWeight: 900, color: "var(--brand-dark)", textDecoration: "underline" }}>
            →
          </Link>
        </div>
      ) : (
        <>
          <label style={lbl}>{t("업체 선택")}</label>
          <select
            style={inp}
            value={placeId}
            onChange={(e) => {
              setPlaceId(e.target.value);
              loadCoupons(e.target.value);
            }}
          >
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div style={{ border: "2px solid var(--brand)", borderRadius: 16, padding: "16px 18px", marginTop: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{t("새 쿠폰 발행")}</div>

            <label style={lbl}>{t("할인 유형")}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {([
                { v: "percent", l: t("% 할인") },
                { v: "amount", l: t("금액 할인") },
                { v: "gift", l: t("서비스 증정") },
              ] as const).map((o) => (
                <div
                  key={o.v}
                  onClick={() => setKind(o.v)}
                  style={{
                    flex: 1,
                    border: kind === o.v ? "2px solid var(--brand)" : "1.5px solid var(--line)",
                    background: kind === o.v ? "var(--brand-bg)" : "#fff",
                    borderRadius: 12,
                    padding: "11px 8px",
                    cursor: "pointer",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {o.l}
                </div>
              ))}
            </div>

            {kind === "gift" ? (
              <>
                <label style={lbl}>{t("증정 내용")}</label>
                <input style={inp} value={gift} onChange={(e) => setGift(e.target.value)} placeholder={t("예: 음료 1잔 서비스")} />
              </>
            ) : (
              <>
                <label style={lbl}>{kind === "percent" ? t("할인율 (%)") : t("할인 금액 (₫)")}</label>
                <input
                  style={inp}
                  inputMode="numeric"
                  value={value ? Number(value.replace(/[^0-9]/g, "")).toLocaleString() : ""}
                  onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={kind === "percent" ? "10" : "50,000"}
                />
              </>
            )}

            <label style={lbl}>{t("최소 결제 금액 (₫, 0 = 조건 없음)")}</label>
            <input
              style={inp}
              inputMode="numeric"
              value={minSpend ? Number(minSpend.replace(/[^0-9]/g, "")).toLocaleString() : ""}
              onChange={(e) => setMinSpend(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="100,000"
            />

            <label style={lbl}>{t("특정 메뉴/서비스만 (선택)")}</label>
            <input style={inp} value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t("예: 아로마 마사지")} />

            <label style={lbl}>{t("사용 방식")}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {([
                { v: "once", l: t("1인 1회") },
                { v: "multi", l: t("재사용 가능 (방문마다)") },
              ] as const).map((o) => (
                <div
                  key={o.v}
                  onClick={() => setUsage(o.v)}
                  style={{
                    flex: 1,
                    border: usage === o.v ? "2px solid var(--brand)" : "1.5px solid var(--line)",
                    background: usage === o.v ? "var(--brand-bg)" : "#fff",
                    borderRadius: 12,
                    padding: "11px 8px",
                    cursor: "pointer",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {o.l}
                </div>
              ))}
            </div>

            <label style={lbl}>{t("수량 한정 (선택, 총 발행 매수 · 비우면 무제한)")}</label>
            <input
              style={inp}
              inputMode="numeric"
              value={maxClaims ? Number(maxClaims.replace(/[^0-9]/g, "")).toLocaleString() : ""}
              onChange={(e) => setMaxClaims(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="100"
            />

            <label style={lbl}>{t("유효기간 (선택)")}</label>
            <input style={inp} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />

            {msg && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: "#C0392B" }}>{msg}</div>}

            <button className="btn pri" style={{ width: "100%", padding: "13px 0", fontSize: 14.5, marginTop: 14 }} onClick={issue} disabled={busy}>
              {busy ? t("발행 중…") : t("쿠폰 발행하기")}
            </button>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 900, marginTop: 24 }}>{t("내 쿠폰")}</h2>
          {coupons.length === 0 && <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink3)" }}>{t("발행된 쿠폰이 없어요.")}</div>}
          {coupons.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 15px", marginTop: 10, opacity: couponValid(c) ? 1 : 0.55 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{couponTitle(c)}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 2 }}>
                  {(c.usage === "multi" ? t("재사용") : t("1인 1회")) + (c.max_claims ? " · " + t("한정") + " " + c.max_claims : "")}
                  {couponCond(c) ? " · " + couponCond(c) : ""}
                  {!c.active && " · " + t("중지됨")}
                </div>
              </div>
              <button className="btn ghost" style={{ padding: "7px 11px", fontSize: 11.5, flexShrink: 0 }} onClick={() => toggleActive(c)}>
                {c.active ? t("중지") : t("재개")}
              </button>
              <button className="btn ghost" style={{ padding: "7px 11px", fontSize: 11.5, color: "#C0392B", flexShrink: 0 }} onClick={() => remove(c)}>
                {t("삭제")}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
