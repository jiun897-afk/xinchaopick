"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";
import { useLang, LangToggle, mkT } from "../../../lib/i18n";

/* 사장님 쿠폰 인증 — QR 스캔 또는 코드 입력 + 사용 내역 */

const VI: Record<string, string> = {
  "← 사장님 센터": "← Trung tâm đối tác",
  "쿠폰 인증": "Xác nhận coupon",
  "손님이 보여주는 쿠폰 QR을 스캔하거나, 8자리 코드를 입력하세요.": "Quét QR coupon của khách hoặc nhập mã 8 ký tự.",
  "QR 스캔하기": "Quét QR",
  "스캔 중지": "Dừng quét",
  "카메라를 쿠폰 QR에 맞춰주세요": "Đưa camera vào mã QR của coupon",
  "코드 직접 입력 (예: AB23CD45)": "Nhập mã (VD: AB23CD45)",
  "인증하기": "Xác nhận",
  "확인 중…": "Đang kiểm tra…",
  "✅ 사용 처리 완료!": "✅ Đã xác nhận sử dụng!",
  "고객": "Khách",
  "사용 내역": "Lịch sử sử dụng",
  "아직 사용된 쿠폰이 없어요.": "Chưa có coupon nào được sử dụng.",
  "로그인 후 이용할 수 있어요.": "Vui lòng đăng nhập.",
  "로그인하기": "Đăng nhập",
  "카메라를 열 수 없어요. 코드를 직접 입력해주세요.": "Không mở được camera. Vui lòng nhập mã.",
};

type Use = { u_code: string; u_title: string; u_nickname: string; u_place: string; u_used_at: string };

export default function RedeemPage() {
  const supabase = getSupabase();
  const [lang, setLang] = useLang();
  const t = mkT(lang, VI);
  const [guest, setGuest] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; sub?: string } | null>(null);
  const [uses, setUses] = useState<Use[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lockRef = useRef(false);

  async function loadUses() {
    if (!supabase) return;
    const { data } = await supabase.rpc("owner_coupon_uses");
    setUses((data as Use[]) ?? []);
  }

  useEffect(() => {
    if (!supabase) {
      setGuest(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setGuest(true);
      else loadUses();
    });
    return () => stopScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function redeem(c: string) {
    if (!supabase || busy) return;
    const v = c.trim().toUpperCase();
    if (v.length < 6) return;
    setBusy(true);
    setResult(null);
    const { data, error } = await supabase.rpc("redeem_coupon", { p_code: v });
    if (error) {
      setResult({ ok: false, text: "❌ " + error.message });
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      setResult({
        ok: true,
        text: t("✅ 사용 처리 완료!"),
        sub: (row?.r_title ?? "") + (row?.r_cond ? " · " + row.r_cond : "") + " — " + t("고객") + ": " + (row?.r_nickname ?? ""),
      });
      setCode("");
      loadUses();
    }
    setBusy(false);
  }

  function stopScan() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    if (scanning) {
      stopScan();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
      lockRef.current = false;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      const jsQR = (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const tick = () => {
        if (!streamRef.current) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA && !lockRef.current) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(img.data, img.width, img.height);
          if (qr?.data && /^[A-Z2-9]{6,12}$/i.test(qr.data.trim())) {
            lockRef.current = true;
            stopScan();
            redeem(qr.data.trim());
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setResult({ ok: false, text: "❌ " + t("카메라를 열 수 없어요. 코드를 직접 입력해주세요.") });
      stopScan();
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 520, paddingTop: 22, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/owner" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
          {t("← 사장님 센터")}
        </Link>
        <span style={{ marginLeft: "auto" }}>
          <LangToggle lang={lang} setLang={setLang} />
        </span>
      </div>
      <h1 style={{ fontSize: 21, fontWeight: 900, marginTop: 12 }}>{t("쿠폰 인증")}</h1>
      <p style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 5, lineHeight: 1.6 }}>{t("손님이 보여주는 쿠폰 QR을 스캔하거나, 8자리 코드를 입력하세요.")}</p>

      {guest ? (
        <div style={{ marginTop: 26, textAlign: "center" }}>
          <div className="notice info">{t("로그인 후 이용할 수 있어요.")}</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "12px 26px" }} href="/login">
            {t("로그인하기")}
          </Link>
        </div>
      ) : (
        <>
          <button className="btn pri" style={{ width: "100%", marginTop: 16, padding: "15px 0", fontSize: 15 }} onClick={startScan}>
            {scanning ? t("스캔 중지") : t("QR 스캔하기")}
          </button>
          <div style={{ display: scanning ? "block" : "none", marginTop: 12, borderRadius: 16, overflow: "hidden", position: "relative", background: "#000" }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block", maxHeight: 340, objectFit: "cover" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>
              {t("카메라를 쿠폰 QR에 맞춰주세요")}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("코드 직접 입력 (예: AB23CD45)")}
              maxLength={12}
              style={{ flex: 1, border: "1.5px solid var(--line)", borderRadius: 14, padding: "14px 15px", fontSize: 15, fontWeight: 800, letterSpacing: 2, fontFamily: "inherit", outline: "none", textTransform: "uppercase" }}
              onKeyDown={(e) => e.key === "Enter" && redeem(code)}
            />
            <button className="btn pri" style={{ padding: "0 20px", fontSize: 14 }} disabled={busy || code.trim().length < 6} onClick={() => redeem(code)}>
              {busy ? t("확인 중…") : t("인증하기")}
            </button>
          </div>

          {result && (
            <div
              className={"notice " + (result.ok ? "ok" : "warn")}
              style={{ marginTop: 14, fontSize: 14, fontWeight: 800, lineHeight: 1.6 }}
            >
              {result.text}
              {result.sub && <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 4 }}>{result.sub}</div>}
            </div>
          )}

          <h2 style={{ fontSize: 15.5, fontWeight: 900, marginTop: 30 }}>{t("사용 내역")}</h2>
          {uses === null ? null : uses.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 10 }}>{t("아직 사용된 쿠폰이 없어요.")}</div>
          ) : (
            uses.map((u, i) => (
              <div key={u.u_code + i} style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--line)", padding: "12px 2px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 900 }}>{u.u_title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 2 }}>
                    {u.u_place && u.u_place + " · "}
                    {t("고객")} {u.u_nickname} · {u.u_code}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink3)", flexShrink: 0, textAlign: "right" }}>
                  {new Date(u.u_used_at).toLocaleDateString("ko-KR")}
                  <br />
                  {new Date(u.u_used_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
