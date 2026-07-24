/* 베자뷰 마스코트 — 논라 쓴 핀 캐릭터 (의사-3D 음영 + CSS 애니메이션) */
export default function Mascot({ variant, size = 56 }: { variant: "eat" | "write"; size?: number }) {
  const uid = variant; // gradient id 충돌 방지
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id={"mg-" + uid} cx="0.35" cy="0.28" r="0.95">
          <stop offset="0" stopColor="#FF9A66" />
          <stop offset="0.55" stopColor="#F55B24" />
          <stop offset="1" stopColor="#D9420F" />
        </radialGradient>
        <linearGradient id={"mh-" + uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9CC" />
          <stop offset="1" stopColor="#FFD3A1" />
        </linearGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="60" cy="112" rx="21" ry="4.5" fill="#26211C" opacity="0.1" />

      <g className="mascotbob">
        {/* 몸통(핀) */}
        <path d="M60 108 C60 108 34 80 34 58 A26 26 0 1 1 86 58 C86 80 60 108 60 108 Z" fill={"url(#mg-" + uid + ")"} />
        {/* 하이라이트 */}
        <ellipse cx="49" cy="47" rx="9" ry="6" fill="#fff" opacity="0.28" />

        {/* 논라 모자 */}
        <path d="M60 11 C64 11 85 28 90 35 L30 35 C35 28 56 11 60 11 Z" fill={"url(#mh-" + uid + ")"} />
        <path d="M23 35 Q60 46 97 35 Q93 42 60 44 Q27 42 23 35 Z" fill="#F3A469" />
        <path d="M60 14 L60 33" stroke="#F3A469" strokeWidth="1.4" opacity="0.55" />
        <path d="M46 20 L52 33 M74 20 L68 33" stroke="#F3A469" strokeWidth="1.2" opacity="0.4" />

        {/* 얼굴 */}
        {variant === "write" && (
          <g stroke="#26211C" strokeWidth="1.6" fill="none" opacity="0.85">
            <circle cx="51" cy="58" r="5.6" />
            <circle cx="69" cy="58" r="5.6" />
            <path d="M56.6 58 L63.4 58" />
          </g>
        )}
        <circle cx="51" cy="58" r="2.7" fill="#26211C" />
        <circle cx="69" cy="58" r="2.7" fill="#26211C" />
        <circle cx="52" cy="57" r="0.9" fill="#fff" />
        <circle cx="70" cy="57" r="0.9" fill="#fff" />
        <path d="M55 66 Q60 70.5 65 66" stroke="#26211C" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="44" cy="64" r="3.2" fill="#FFB3A0" opacity="0.75" />
        <circle cx="76" cy="64" r="3.2" fill="#FFB3A0" opacity="0.75" />

        {/* 왼팔 (고정) */}
        <path d="M38 68 Q30 72 28 78" stroke="#D9420F" strokeWidth="6" fill="none" strokeLinecap="round" />

        {variant === "eat" ? (
          <>
            {/* 오른팔 + 젓가락 + 면발 */}
            <g className="mascotarm">
              <path d="M82 66 Q92 62 96 52" stroke="#D9420F" strokeWidth="6" fill="none" strokeLinecap="round" />
              <path d="M95 53 L106 30" stroke="#8B5E3C" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M98 56 L111 35" stroke="#8B5E3C" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M106 30 Q103 20 93 22 Q86 24 88 30" stroke="#FFD24D" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
            {/* 반짝이 */}
            <g fill="#FFD24D">
              <path className="mascotspark" d="M22 46 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 Z" />
              <path className="mascotspark2" d="M98 76 l1.4 3 3 1.4 -3 1.4 -1.4 3 -1.4 -3 -3 -1.4 3 -1.4 Z" />
            </g>
          </>
        ) : (
          <>
            {/* 종이 */}
            <g transform="rotate(-8 84 97)">
              <rect x="70" y="88" width="28" height="18" rx="3" fill="#fff" stroke="#E5DED4" strokeWidth="1.2" />
              <path d="M75 94 H92 M75 99 H88" stroke="#C9C0B4" strokeWidth="1.6" strokeLinecap="round" />
            </g>
            {/* 오른팔 + 연필 */}
            <g className="mascotpen">
              <path d="M82 66 Q90 72 87 80" stroke="#D9420F" strokeWidth="6" fill="none" strokeLinecap="round" />
              <path d="M99 56 L86 86" stroke="#FFC24D" strokeWidth="5" strokeLinecap="round" />
              <path d="M86 86 L83.4 92 L88.8 88.6 Z" fill="#8B5E3C" />
              <path d="M99 56 L101 51" stroke="#FF7A8A" strokeWidth="5" strokeLinecap="round" />
            </g>
            <path className="mascotspark" d="M24 50 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 Z" fill="#C4B5FD" />
          </>
        )}
      </g>
    </svg>
  );
}
