"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase";
import { useLang } from "../../lib/i18n";

/* 내 쿠폰함 — 매장에서 QR 또는 코드를 보여주고 사장님이 인증하면 사용 완료 */
type UC = {
  uc_id: string;
  uc_code: string;
  uc_status: "active" | "used";
  uc_used_at: string | null;
  kind: "percent" | "amount" | "gift";
  value: number;
  min_spend: number;
  target: string;
  gift: string;
  expires_at: string | null;
  active: boolean;
  place_name: string | null;
  place_id: string | null;
};

function title(c: UC) {
  const scope = c.target ? c.target + " " : "";
  if (c.kind === "percent") return `${scope}${c.value}% 할인`;
  if (c.kind === "amount") return `${scope}${Number(c.value).toLocaleString()}₫ 할인`;
  return c.gift || "서비스 증정";
}

function Qr({ text, size }: { text: string; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    (async () => {
      const QRCode = (await import("qrcode")).default ?? (await import("qrcode"));
      if (ref.current) QRCode.toCanvas(ref.current, text, { width: size, margin: 1, color: { dark: "#241a12", light: "#ffffff" } });
    })();
  }, [text, size]);
  return <canvas ref={ref} style={{ borderRadius: 10 }} />;
}

export default function MyCouponsPage() {
  const supabase = getSupabase();
  const [lang] = useLang();
  const vi = lang === "vi";
  const [rows, setRows] = useState<UC[] | null>(null);
  const [guest, setGuest] = useState(false);
  const [open, setOpen] = useState<string | null>(null); // 크게 보기(QR)

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
      const { data } = await supabase.rpc("my_coupons");
      setRows((data as UC[]) ?? []);
    })();
  }, [supabase]);

  const sel = rows?.find((r) => r.uc_id === open) ?? null;

  return (
    <div className="wrap" style={{ maxWidth: 520, paddingTop: 22, paddingBottom: 90 }}>
      <h1 style={{ fontSize: 21, fontWeight: 900 }}>{vi ? "Coupon của tôi" : "내 쿠폰함"}</h1>
      <p style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 5, lineHeight: 1.6 }}>
        {vi ? "Đưa QR hoặc mã cho cửa hàng để xác nhận sử dụng." : "매장에서 QR이나 코드를 보여주면 사장님이 인증하고 바로 적용돼요."}
      </p>

      {guest ? (
        <div style={{ marginTop: 26, textAlign: "center" }}>
          <div className="notice info">{vi ? "Vui lòng đăng nhập." : "로그인 후 이용할 수 있어요."}</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "12px 26px" }} href="/login">
            {vi ? "Đăng nhập" : "로그인하기"}
          </Link>
        </div>
      ) : rows === null ? (
        <div style={{ marginTop: 26, fontSize: 13, color: "var(--ink3)" }}>{vi ? "Đang tải…" : "불러오는 중…"}</div>
      ) : rows.length === 0 ? (
        <div style={{ marginTop: 30, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink2)" }}>{vi ? "Chưa có coupon nào." : "받은 쿠폰이 없어요."}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 6 }}>
            {vi ? "Nhận coupon ở trang cửa hàng nhé!" : "업체 페이지에서 쿠폰을 받아보세요!"}
          </div>
          <Link className="btn pri" style={{ marginTop: 16, padding: "12px 24px" }} href="/places">
            {vi ? "Xem cửa hàng" : "업체 둘러보기"}
          </Link>
        </div>
      ) : (
        rows.map((r) => {
          const used = r.uc_status === "used";
          return (
            <div
              key={r.uc_id}
              onClick={() => !used && setOpen(r.uc_id)}
              style={{
                marginTop: 12,
                border: "1px solid var(--line)",
                borderRadius: 16,
                background: "#fff",
                padding: "14px 15px",
                display: "flex",
                alignItems: "center",
                gap: 13,
                opacity: used ? 0.55 : 1,
                cursor: used ? "default" : "pointer",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink3)" }}>{r.place_name ?? "베자뷰"}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: used ? "var(--ink3)" : "var(--brand-dark)", marginTop: 2 }}>{title(r)}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 3 }}>
                  {r.min_spend > 0 && `${Number(r.min_spend).toLocaleString()}₫ ${vi ? "trở lên" : "이상 결제 시"} · `}
                  {r.expires_at ? `~${r.expires_at.slice(5).replace("-", "/")}` : vi ? "Không hạn" : "기한 없음"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.5, marginTop: 6, color: used ? "var(--ink3)" : "var(--ink)" }}>{r.uc_code}</div>
              </div>
              {used ? (
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--ink3)", flexShrink: 0, textAlign: "center" }}>
                  {vi ? "Đã dùng" : "사용 완료"}
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>{r.uc_used_at ? new Date(r.uc_used_at).toLocaleDateString("ko-KR") : ""}</div>
                </div>
              ) : (
                <div style={{ flexShrink: 0 }}>
                  <Qr text={r.uc_code} size={74} />
                </div>
              )}
            </div>
          );
        })
      )}

      {sel && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, zIndex: 980, background: "rgba(20,15,10,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, padding: "26px 22px", width: "100%", maxWidth: 340, textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink3)" }}>{sel.place_name ?? "베자뷰"}</div>
            <div style={{ fontSize: 19, fontWeight: 900, color: "var(--brand-dark)", marginTop: 4 }}>{title(sel)}</div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Qr text={sel.uc_code} size={210} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 3, marginTop: 14 }}>{sel.uc_code}</div>
            <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 8, lineHeight: 1.6 }}>
              {vi ? "Đưa màn hình này cho nhân viên cửa hàng." : "이 화면을 매장 직원에게 보여주세요."}
            </div>
            <button className="btn ghost" style={{ width: "100%", marginTop: 16, padding: "12px 0" }} onClick={() => setOpen(null)}>
              {vi ? "Đóng" : "닫기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
