/* 지역·업종 아이콘 — 마스코트(논라 핀)가 장면마다 완전히 다른 포즈/표정/소품 (48×48) */

type Exp = "smile" | "closed" | "wow" | "wink" | "sleep";

function Face({ exp = "smile", gid }: { exp?: Exp; gid: string }) {
  return (
    <g>
      <circle r="14" fill={"url(#" + gid + ")"} />
      <ellipse cx="-5" cy="-5" rx="4" ry="3" fill="#fff" opacity="0.25" />
      {/* 눈 */}
      {exp === "closed" || exp === "sleep" ? (
        <g stroke="#26211C" strokeWidth="1.8" fill="none" strokeLinecap="round">
          <path d="M-7.5 -1.5 Q-5 1 -2.5 -1.5" />
          <path d="M2.5 -1.5 Q5 1 7.5 -1.5" />
        </g>
      ) : exp === "wink" ? (
        <g>
          <circle cx="-5" cy="-1" r="2.2" fill="#26211C" />
          <circle cx="-4.2" cy="-1.8" r="0.8" fill="#fff" />
          <path d="M2.5 -1.5 Q5 1 7.5 -1.5" stroke="#26211C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <circle cx="-5" cy="-1" r="2.2" fill="#26211C" />
          <circle cx="5" cy="-1" r="2.2" fill="#26211C" />
          <circle cx="-4.2" cy="-1.8" r="0.8" fill="#fff" />
          <circle cx="5.8" cy="-1.8" r="0.8" fill="#fff" />
        </g>
      )}
      {/* 입 */}
      {exp === "wow" ? (
        <ellipse cx="0" cy="5.5" rx="2.8" ry="3.4" fill="#7A2E12" />
      ) : exp === "sleep" ? (
        <circle cx="0" cy="5.5" r="1.6" fill="#7A2E12" />
      ) : (
        <path d="M-3.5 4.5 Q0 7.5 3.5 4.5" stroke="#26211C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}
      <circle cx="-9.5" cy="3" r="2.6" fill="#FFB3A0" opacity="0.75" />
      <circle cx="9.5" cy="3" r="2.6" fill="#FFB3A0" opacity="0.75" />
    </g>
  );
}

function Nonla() {
  return (
    <g>
      <path d="M0 -23 C2.5 -23 15 -12 18 -8 L-18 -8 C-15 -12 -2.5 -23 0 -23 Z" fill="#FFE3BC" />
      <path d="M-21 -8 Q0 -2 21 -8 Q19 -4 0 -2.5 Q-19 -4 -21 -8 Z" fill="#F3A469" />
      <path d="M0 -21 L0 -9" stroke="#F3A469" strokeWidth="1" opacity="0.5" />
    </g>
  );
}

function Grad({ gid }: { gid: string }) {
  return (
    <defs>
      <radialGradient id={gid} cx="0.35" cy="0.3" r="0.95">
        <stop offset="0" stopColor="#FF9A66" />
        <stop offset="0.6" stopColor="#F55B24" />
        <stop offset="1" stopColor="#E04A14" />
      </radialGradient>
    </defs>
  );
}

function Scene({ name, gid }: { name: string; gid: string }) {
  switch (name) {
    /* ───── 업종 ───── */
    case "로컬맛집": // 그릇에 코 박고 후루룩
      return (
        <g>
          <g transform="translate(24 17) scale(0.92)">
            <Nonla />
            <Face exp="wow" gid={gid} />
          </g>
          <path d="M30 10 L40 2 M33 13 L43 6" stroke="#8B5E3C" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M24 24 Q22 30 24 33 Q26 36 24 38" stroke="#F0B429" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M7 33 a17 11.5 0 0 0 34 0 Z" fill="#fff" />
          <path d="M7 33 h34 l-1.3 3.4 h-31.4 Z" fill="#F55B24" />
        </g>
      );
    case "한식": // 뚝배기 들고 헤벌쭉
      return (
        <g>
          <g transform="translate(16 18) scale(0.88)">
            <Nonla />
            <Face exp="closed" gid={gid} />
          </g>
          <path d="M25 26 Q31 24 34 28" stroke="#D9420F" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M28 33 a9.5 8 0 0 0 19 0 Z" fill="#4A3B32" />
          <ellipse cx="37.5" cy="33" rx="9.5" ry="2.6" fill="#5F4C40" />
          <ellipse cx="37.5" cy="33" rx="7" ry="1.8" fill="#E0483E" />
          <path d="M34 27 q-2 -3 0.5 -6 M41 27 q-2 -3 0.5 -6" stroke="#D8CCC0" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      );
    case "마사지·스파": // 엎드려서 스르르
      return (
        <g>
          <path d="M4 40 h40" stroke="#D8B48F" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="29" cy="32" rx="14" ry="7.5" fill={"url(#" + gid + ")"} />
          <rect x="20" y="24" width="18" height="7" rx="3.5" fill="#CBE8DF" />
          <g transform="translate(13 29) scale(0.82)">
            <Face exp="sleep" gid={gid} />
          </g>
          <path d="M9 15 q-2 -3.5 0.5 -7 M16 13 q-2 -3.5 0.5 -7" stroke="#A8D8CB" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M36 15 C38 15 44 20 46 22 L26 22 C28 20 34 15 36 15 Z" fill="#FFE3BC" transform="rotate(14 36 19)" />
        </g>
      );
    case "카페·디저트": // 큰 컵 두 손으로 홀짝
      return (
        <g>
          <g transform="translate(24 16) scale(0.9)">
            <Nonla />
            <Face exp="closed" gid={gid} />
          </g>
          <path d="M14 27 h20 v6 a10 8 0 0 1 -20 0 Z" fill="#fff" />
          <ellipse cx="24" cy="27" rx="10" ry="2.4" fill="#8B5E3C" />
          <path d="M34 29 h2.6 a4 4 0 0 1 0 8 h-2.2" fill="none" stroke="#D8CCC0" strokeWidth="2.2" />
          <path d="M12 30 Q9 32 10 35 M36 30 Q39 32 38 35" stroke="#D9420F" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M20 23 q-2 -3 0.5 -6" stroke="#D8CCC0" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      );
    case "투어·액티비티": // 튜브 타고 둥둥 + 선글라스
      return (
        <g>
          <g transform="translate(24 19) scale(0.9)">
            <Nonla />
            <Face exp="smile" gid={gid} />
            <rect x="-9.5" y="-4.5" width="8" height="5.5" rx="2.4" fill="#26211C" />
            <rect x="1.5" y="-4.5" width="8" height="5.5" rx="2.4" fill="#26211C" />
            <path d="M-1.5 -2.5 h3" stroke="#26211C" strokeWidth="1.6" />
          </g>
          <circle cx="24" cy="34" r="11.5" fill="none" stroke="#FF6B6B" strokeWidth="6" />
          <path d="M24 22.5 A11.5 11.5 0 0 1 35.5 34" fill="none" stroke="#fff" strokeWidth="6" strokeDasharray="6 8" />
          <path d="M2 44 Q8 41 14 44 M34 44 Q40 41 46 44" stroke="#5BB8E8" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
      );
    case "네일·뷰티": // 윙크하며 네일 자랑
      return (
        <g>
          <g transform="translate(18 18) scale(0.9)">
            <Nonla />
            <Face exp="wink" gid={gid} />
          </g>
          <path d="M28 26 Q34 28 36 33" stroke="#D9420F" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <circle cx="37.5" cy="35" r="4" fill="#FF9A66" />
          <circle cx="35.5" cy="31.5" r="1.5" fill="#F472B6" />
          <circle cx="39.5" cy="31.5" r="1.5" fill="#F472B6" />
          <path d="M38 8 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 Z" fill="#FFD24D" />
          <circle cx="30" cy="4" r="1.6" fill="#F9A8D4" />
        </g>
      );
    case "사진·스냅": // 카메라 들고 찰칵
      return (
        <g>
          <g transform="translate(24 15) scale(0.88)">
            <Nonla />
            <Face exp="wink" gid={gid} />
          </g>
          <rect x="10" y="26" width="28" height="16" rx="4.5" fill="#475569" />
          <circle cx="24" cy="34" r="6" fill="#fff" />
          <circle cx="24" cy="34" r="3.8" fill="#60A5FA" />
          <circle cx="33.5" cy="30" r="1.4" fill="#FFD24D" />
          <path d="M8 29 Q5 30 5 33 M40 29 Q43 30 43 33" stroke="#D9420F" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M41 18 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 Z" fill="#FFD24D" />
        </g>
      );
    case "숙소·풀빌라": // 나이트캡 쓰고 쿨쿨
      return (
        <g>
          <g transform="translate(22 22) scale(0.95)">
            <Face exp="sleep" gid={gid} />
            <path d="M-13 -6 Q-6 -18 10 -13 L13 -6 Z" fill="#7BA7D4" />
            <circle cx="12" cy="-13" r="3" fill="#fff" />
          </g>
          <path d="M4 34 Q10 31 16 34 Q22 37 28 34 Q34 31 40 34 L44 34 V42 H4 Z" fill="#BFDBF7" />
          <text x="36" y="14" fontSize="10" fontWeight="900" fill="#93BFEA">z</text>
          <text x="42" y="8" fontSize="7" fontWeight="900" fill="#B9D4EE">z</text>
        </g>
      );
    case "기타": // 반짝이 사이 신남
      return (
        <g>
          <g transform="translate(24 24) scale(1)">
            <Nonla />
            <Face exp="smile" gid={gid} />
          </g>
          <path d="M11 32 Q6 34 4 38 M37 32 Q42 34 44 38" stroke="#D9420F" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M7 8 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 Z" fill="#FFD24D" />
          <path d="M40 6 l1.4 3.2 3.2 1.4 -3.2 1.4 -1.4 3.2 -1.4 -3.2 -3.2 -1.4 3.2 -1.4 Z" fill="#FFD24D" opacity="0.85" />
        </g>
      );
    case "전체 보기":
    case "전체": // 돋보기 탐색
      return (
        <g>
          <g transform="translate(18 20) scale(0.92)">
            <Nonla />
            <Face exp="smile" gid={gid} />
          </g>
          <path d="M27 27 Q31 29 33 32" stroke="#D9420F" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <circle cx="35" cy="33" r="7" fill="none" stroke="#F55B24" strokeWidth="3.4" />
          <circle cx="35" cy="33" r="5" fill="#FFF3EC" opacity="0.6" />
          <path d="M40 38.5 L45 44" stroke="#F55B24" strokeWidth="3.6" strokeLinecap="round" />
        </g>
      );

    /* ───── 지역 ───── */
    case "다낭": // 서핑!
      return (
        <g>
          <g transform="translate(24 15) scale(0.85) rotate(-6)">
            <Nonla />
            <Face exp="wow" gid={gid} />
          </g>
          <path d="M10 26 Q6 29 5 33 M38 26 Q42 29 43 33" stroke="#D9420F" strokeWidth="4" fill="none" strokeLinecap="round" />
          <g transform="rotate(-10 24 36)">
            <ellipse cx="24" cy="36" rx="17" ry="4.5" fill="#FF8A5C" />
            <ellipse cx="24" cy="36" rx="17" ry="1.8" fill="#FFE3BC" />
          </g>
          <path d="M2 44 Q10 40 18 44 Q28 47 36 44 Q42 42 46 44" stroke="#5BB8E8" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "나트랑": // 스노클 마스크
      return (
        <g>
          <g transform="translate(24 21) scale(1)">
            <Face exp="wow" gid={gid} />
            <rect x="-11" y="-6.5" width="22" height="10" rx="5" fill="none" stroke="#2E86C1" strokeWidth="2.8" />
            <rect x="-8" y="-4" width="16" height="5.5" rx="2.75" fill="#AED6F1" opacity="0.85" />
          </g>
          <path d="M36 14 Q41 15 41 21 Q41 26 37 27" fill="none" stroke="#F0B429" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="10" cy="8" r="1.8" fill="#AED6F1" />
          <circle cx="14" cy="4" r="1.2" fill="#AED6F1" />
          <path d="M2 42 Q12 38 24 42 Q36 46 46 42" stroke="#5BB8E8" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "푸꾸옥": // 야자수 아래 코코넛
      return (
        <g>
          <path d="M10 34 Q9 20 12 10" stroke="#8B5E3C" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M12 10 Q4 7 0 10 Q6 12 12 10 Z" fill="#3FA55E" />
          <path d="M12 10 Q20 6 25 9 Q18 12 12 10 Z" fill="#4CB96E" />
          <path d="M12 10 Q10 3 3 2 Q7 8 12 10 Z" fill="#4CB96E" />
          <g transform="translate(29 22) scale(0.88)">
            <Nonla />
            <Face exp="closed" gid={gid} />
          </g>
          <path d="M20 30 Q17 33 17 36" stroke="#D9420F" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="16" cy="38" r="5" fill="#8B5E3C" />
          <path d="M16 33 L18 29" stroke="#F0B429" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M32 42 Q39 39 46 42" stroke="#F0C48A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "호치민": // 스쿠터 헬멧 붕붕
      return (
        <g>
          <g transform="translate(24 20) scale(0.95)">
            <Face exp="smile" gid={gid} />
            <path d="M-14 -4 a14 12 0 0 1 28 0 Z" fill="#FFD24D" />
            <path d="M-14 -4 h28 l-2 3 h-24 Z" fill="#F0B429" />
          </g>
          <path d="M8 36 h32" stroke="#4A5568" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 36 Q10 31 14 30 M36 36 Q38 31 34 30" stroke="#4A5568" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M2 14 h6 M1 20 h5 M3 26 h4" stroke="#C9D4E0" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case "하노이": // 금성홍기 흔들기
      return (
        <g>
          <g transform="translate(19 24) scale(0.9)">
            <Nonla />
            <Face exp="smile" gid={gid} />
          </g>
          <path d="M28 28 Q33 24 35 19" stroke="#D9420F" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M36 18 V3" stroke="#8B5E3C" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M36 4 Q42 2 46 5 Q42 9 36 12 Z" fill="#E0483E" />
          <path d="M40.2 5.4 l0.9 2 2.2 0.2 -1.7 1.4 0.5 2.2 -1.9 -1.2 -1.9 1.2 0.5 -2.2 -1.7 -1.4 2.2 -0.2 Z" fill="#FFD24D" />
        </g>
      );
    case "달랏": // 꽃다발 안고
      return (
        <g>
          <g transform="translate(24 18) scale(0.9)">
            <Nonla />
            <Face exp="closed" gid={gid} />
          </g>
          <path d="M14 28 Q11 32 12 36 M34 28 Q37 32 36 36" stroke="#D9420F" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M17 38 Q24 30 31 38 L29 43 H19 Z" fill="#4CB96E" />
          <circle cx="17" cy="32" r="3.6" fill="#F472B6" />
          <circle cx="24" cy="29.5" r="3.6" fill="#FFD24D" />
          <circle cx="31" cy="32" r="3.6" fill="#F9A8D4" />
          <circle cx="17" cy="32" r="1.3" fill="#fff" />
          <circle cx="24" cy="29.5" r="1.3" fill="#fff" />
          <circle cx="31" cy="32" r="1.3" fill="#fff" />
        </g>
      );
    case "무이네": // 모래언덕에서 연날리기
      return (
        <g>
          <path d="M14 8 L19 3 L21.5 8.5 L16.5 11.5 Z" fill="#E0483E" />
          <path d="M17 11 Q15 16 17 20" stroke="#B03A32" strokeWidth="1.3" fill="none" />
          <g transform="translate(28 24) scale(0.85)">
            <Nonla />
            <Face exp="wow" gid={gid} />
          </g>
          <path d="M20 28 Q17 24 17 20" stroke="#D9420F" strokeWidth="3.6" fill="none" strokeLinecap="round" />
          <path d="M2 40 Q12 28 26 36 Q18 39 12 40 Z" fill="#F0A860" />
          <path d="M10 40 Q26 30 46 38 L46 43 H2 L2 40 Z" fill="#FFC98A" />
        </g>
      );
    case "붕따우": // 등대 옆에서 인사
      return (
        <g>
          <path d="M8 38 L10 12 h7 L19 38 Z" fill="#fff" stroke="#E8DFD3" strokeWidth="1" />
          <path d="M9.3 20 h8.4 l0.4 4.5 h-9.2 Z M8.5 30 h10 l0.4 4.5 h-10.8 Z" fill="#E0483E" />
          <rect x="9.5" y="6" width="8" height="6" rx="1.5" fill="#334155" />
          <circle cx="13.5" cy="9" r="1.8" fill="#FFD24D" />
          <g transform="translate(32 25) scale(0.88)">
            <Nonla />
            <Face exp="smile" gid={gid} />
          </g>
          <path d="M41 20 Q45 16 45 12" stroke="#D9420F" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M4 43 Q16 40 28 43 Q38 45 46 43" stroke="#5BB8E8" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </g>
      );
    case "하롱베이": // 나룻배 유람
      return (
        <g>
          <path d="M5 26 Q8 12 12 26 Z" fill="#8FAE9C" />
          <path d="M38 25 Q41 14 44 25 Z" fill="#A8C3B3" />
          <g transform="translate(24 21) scale(0.82)">
            <Nonla />
            <Face exp="smile" gid={gid} />
          </g>
          <path d="M11 33 h26 l-4 6 h-18 Z" fill="#8B5E3C" />
          <path d="M33 30 L40 22" stroke="#8B5E3C" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M2 43 Q12 39 24 43 Q36 47 46 43" stroke="#5BB8E8" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "사파": // 계단논에서 벼 들고
      return (
        <g>
          <path d="M2 30 Q24 20 46 30 L46 36 Q24 27 2 36 Z" fill="#94CC6F" />
          <path d="M2 38 Q24 30 46 38 L46 44 H2 Z" fill="#B7DF92" />
          <g transform="translate(21 18) scale(0.88)">
            <Nonla />
            <Face exp="smile" gid={gid} />
          </g>
          <path d="M30 24 Q34 21 35 17" stroke="#D9420F" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M36 16 Q36 10 37 5" stroke="#7CA843" strokeWidth="2" fill="none" strokeLinecap="round" />
          {[
            [34, 7, -35],
            [40, 7, 35],
            [33.5, 12, -40],
            [40.5, 12, 40],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="2" ry="3.6" fill="#F0C948" transform={"rotate(" + r + " " + x + " " + y + ")"} />
          ))}
        </g>
      );
    default:
      return (
        <g transform="translate(24 24)">
          <Nonla />
          <Face exp="smile" gid={gid} />
        </g>
      );
  }
}

export default function MascotIcon({ name, size = 40 }: { name: string; size?: number }) {
  const gid = "mg-" + name.replace(/[^a-zA-Z0-9가-힣]/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block", overflow: "hidden" }}>
      <Grad gid={gid} />
      <Scene name={name} gid={gid} />
    </svg>
  );
}
