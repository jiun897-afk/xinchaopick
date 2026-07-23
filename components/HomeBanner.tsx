"use client";

import { useEffect, useRef, useState } from "react";

export type BannerData = {
  id: string;
  tag: string;
  title: string; // 줄바꿈은 \n
  sub: string;
  href: string;
  bg: string;
  art: string; // pin | coin | mega | none
  dark: boolean;
};

/* 장식 그래픽 (SVG라 어떤 화면에서도 선명해요) */
function PinArt() {
  return (
    <svg width="150" height="150" viewBox="0 0 120 124" style={{ position: "absolute", right: -18, bottom: -34, opacity: 0.22 }}>
      <path d="M60 118 C60 118 30 86 30 61 A30 30 0 1 1 90 61 C90 86 60 118 60 118 Z" fill="#fff" />
      <circle cx="60" cy="59" r="12.5" fill="#F04E1A" />
      <path d="M60 6 C64 6 88 26 94 34 L26 34 C32 26 56 6 60 6 Z" fill="#fff" />
    </svg>
  );
}
function CoinArt() {
  return (
    <svg width="160" height="140" viewBox="0 0 160 140" style={{ position: "absolute", right: -8, bottom: -26, opacity: 0.9 }}>
      <circle cx="112" cy="86" r="44" fill="#FFB27A" opacity="0.35" />
      <circle cx="112" cy="80" r="36" fill="#FF8A50" opacity="0.5" />
      <text x="112" y="93" textAnchor="middle" fontSize="38" fontWeight="900" fill="#fff">0đ</text>
      <circle cx="52" cy="34" r="10" fill="#FFB27A" opacity="0.4" />
      <circle cx="146" cy="24" r="6" fill="#FFB27A" opacity="0.5" />
    </svg>
  );
}
function MegaArt() {
  return (
    <svg width="150" height="140" viewBox="0 0 150 140" style={{ position: "absolute", right: -4, bottom: -22, opacity: 0.95 }}>
      <circle cx="104" cy="84" r="46" fill="#FF7A45" opacity="0.14" />
      <g transform="rotate(-14 104 84)">
        <path d="M70 76 L118 56 L118 104 L70 92 Z" fill="#FF7A45" opacity="0.75" />
        <rect x="60" y="74" width="14" height="20" rx="4" fill="#F04E1A" opacity="0.8" />
        <path d="M122 66 Q136 80 122 96" stroke="#F04E1A" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}
const ARTS: Record<string, React.ReactNode> = { pin: <PinArt />, coin: <CoinArt />, mega: <MegaArt />, none: null };

const FALLBACK: BannerData[] = [
  { id: "fb1", tag: "EVENT", title: "다낭 정식 오픈 기념\n전 캠페인 신청 무료", sub: "오픈 기간엔 선정 확률도 높아요", href: "#campaigns", bg: "linear-gradient(115deg,#FF7A45,#F04E1A)", art: "pin", dark: true },
  { id: "fb2", tag: "사장님", title: "입점비·수수료 0원\n한국인 손님 모으기", sub: "등록 10분이면 끝 — 자세히 보기", href: "/partner", bg: "linear-gradient(115deg,#2A2118,#4A3520)", art: "coin", dark: true },
  { id: "fb3", tag: "공지", title: "씬짜오PICK이\n베자뷰로 새단장했어요", sub: "이름은 바뀌어도 혜택은 그대로", href: "#campaigns", bg: "linear-gradient(115deg,#FFF3E7,#FFE3CC)", art: "mega", dark: false },
];

export default function HomeBanner({ banners }: { banners?: BannerData[] }) {
  const list = banners && banners.length > 0 ? banners : FALLBACK;
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchX = useRef<number | null>(null);
  const n = list.length;

  function arm() {
    if (timer.current) clearInterval(timer.current);
    if (n > 1) timer.current = setInterval(() => setI((v) => (v + 1) % n), 4200);
  }
  useEffect(() => {
    arm();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  function go(d: number) {
    setI((v) => (v + d + n) % n);
    arm();
  }

  return (
    <div className="wrap" style={{ marginTop: 6 }}>
      <div
        style={{ position: "relative", overflow: "hidden", borderRadius: 18 }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <div
          style={{
            display: "flex",
            transform: `translateX(-${Math.min(i, n - 1) * 100}%)`,
            transition: "transform .45s cubic-bezier(.22,.8,.3,1)",
          }}
        >
          {list.map((b) => (
            <a
              key={b.id}
              href={b.href}
              style={{
                flex: "0 0 100%",
                position: "relative",
                display: "block",
                background: b.bg,
                padding: "22px 24px 24px",
                minHeight: 128,
                overflow: "hidden",
              }}
            >
              {ARTS[b.art] ?? null}
              <span
                style={{
                  display: "inline-block",
                  fontSize: 10.5,
                  fontWeight: 900,
                  letterSpacing: 0.6,
                  borderRadius: 6,
                  padding: "3px 8px",
                  background: b.dark ? "rgba(255,255,255,.18)" : "rgba(240,78,26,.12)",
                  color: b.dark ? "#fff" : "var(--brand-dark)",
                }}
              >
                {b.tag}
              </span>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 18.5,
                  fontWeight: 900,
                  lineHeight: 1.32,
                  letterSpacing: "-0.02em",
                  color: b.dark ? "#fff" : "var(--ink)",
                }}
              >
                {b.title.split("\n").map((t, k) => (
                  <span key={k}>
                    {k > 0 && <br />}
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600, color: b.dark ? "rgba(255,255,255,.82)" : "var(--ink2)" }}>
                {b.sub}
              </div>
            </a>
          ))}
        </div>
        {n > 1 && (
          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 10,
              display: "flex",
              gap: 5,
              alignItems: "center",
              background: "rgba(0,0,0,.22)",
              borderRadius: 20,
              padding: "5px 9px",
            }}
          >
            {list.map((b, k) => (
              <span
                key={b.id}
                onClick={(e) => {
                  e.preventDefault();
                  setI(k);
                  arm();
                }}
                style={{
                  width: k === i ? 14 : 5,
                  height: 5,
                  borderRadius: 4,
                  background: k === i ? "#fff" : "rgba(255,255,255,.55)",
                  transition: "width .3s",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
