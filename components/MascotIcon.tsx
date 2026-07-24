/* 지역·업종 아이콘용 미니 마스코트 — 논라 핀 얼굴 + 테마 소품 */

function Accessory({ name }: { name: string }) {
  switch (name) {
    /* ── 업종 ── */
    case "로컬맛집":
      return (
        <g>
          <path d="M4 16 a12 10 0 0 0 26 0 Z" fill="#fff" stroke="#E0855A" strokeWidth="2" />
          <path d="M9 15 Q12 11 15 15 Q18 11 21 15 Q24 11 26 15" stroke="#F0B429" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M10 12 L22 -2 M15 13 L27 0" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "한식":
      return (
        <g>
          <path d="M3 12 a13 11 0 0 0 28 0 Z" fill="#3B322C" />
          <ellipse cx="17" cy="12" rx="14" ry="3.5" fill="#5A4C42" />
          <path d="M9 11 Q13 8 17 11 Q21 8 25 11" stroke="#E05B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M12 4 Q11 1 13 -1 M20 4 Q19 1 21 -1" stroke="#C9C0B4" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      );
    case "마사지·스파":
      return (
        <g>
          <rect x="2" y="10" width="28" height="12" rx="6" fill="#CBE8DF" />
          <circle cx="9" cy="16" r="4.5" fill="none" stroke="#8FCBBB" strokeWidth="2" />
          <path d="M16 6 Q15 3 17 0 M23 6 Q22 3 24 0" stroke="#A8D8CB" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "카페·디저트":
      return (
        <g>
          <path d="M4 8 h20 v9 a8 8 0 0 1 -20 0 Z" fill="#fff" stroke="#B08968" strokeWidth="2" />
          <path d="M24 10 h3 a4 4 0 0 1 0 8 h-3" fill="none" stroke="#B08968" strokeWidth="2" />
          <path d="M10 5 Q9 2 11 -1 M17 5 Q16 2 18 -1" stroke="#C9A07E" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      );
    case "투어·액티비티":
      return (
        <g>
          <circle cx="16" cy="13" r="10.5" fill="none" stroke="#FF6B6B" strokeWidth="6.5" />
          <path d="M16 2.5 A10.5 10.5 0 0 1 26.5 13" fill="none" stroke="#fff" strokeWidth="6.5" strokeDasharray="7 9" />
        </g>
      );
    case "네일·뷰티":
      return (
        <g>
          <rect x="9" y="9" width="13" height="14" rx="4" fill="#F472B6" />
          <rect x="12.5" y="2" width="6" height="8" rx="1.6" fill="#9D5B8B" />
          <circle cx="26" cy="6" r="2" fill="#FFD24D" />
        </g>
      );
    case "사진·스냅":
      return (
        <g>
          <rect x="3" y="6" width="26" height="17" rx="4" fill="#4A5568" />
          <rect x="11" y="2.5" width="9" height="5" rx="2" fill="#4A5568" />
          <circle cx="16" cy="14.5" r="5.5" fill="#fff" />
          <circle cx="16" cy="14.5" r="3" fill="#63B3ED" />
          <circle cx="25" cy="9.5" r="1.4" fill="#FFD24D" />
        </g>
      );
    case "숙소·풀빌라":
      return (
        <g>
          <rect x="2" y="10" width="28" height="13" rx="6" fill="#BFDBF7" />
          <rect x="2" y="10" width="9" height="13" rx="4.5" fill="#93BFEA" />
          <text x="18" y="7" fontSize="9" fontWeight="900" fill="#7BA7D4">z</text>
          <text x="24" y="4" fontSize="6.5" fontWeight="900" fill="#A7C7E7">z</text>
        </g>
      );
    case "기타":
      return (
        <g fill="#FFD24D">
          <path d="M10 2 l2.6 6 6 2.6 -6 2.6 -2.6 6 -2.6 -6 -6 -2.6 6 -2.6 Z" />
          <path d="M24 12 l1.7 3.8 3.8 1.7 -3.8 1.7 -1.7 3.8 -1.7 -3.8 -3.8 -1.7 3.8 -1.7 Z" opacity="0.85" />
        </g>
      );
    case "전체 보기":
    case "전체":
      return (
        <g>
          <circle cx="13" cy="11" r="8.5" fill="none" stroke="#F55B24" strokeWidth="3.5" />
          <path d="M19.5 17.5 L27 25" stroke="#F55B24" strokeWidth="4" strokeLinecap="round" />
        </g>
      );

    /* ── 지역 ── */
    case "다낭":
      return (
        <g transform="rotate(-28 16 12)">
          <ellipse cx="16" cy="12" rx="7" ry="16" fill="#FF8A5C" />
          <ellipse cx="16" cy="12" rx="3" ry="16" fill="#FFE3BC" />
          <path d="M16 -4 L16 28" stroke="#E0764A" strokeWidth="1.4" />
        </g>
      );
    case "나트랑":
      return (
        <g>
          <rect x="3" y="6" width="21" height="13" rx="6.5" fill="none" stroke="#2E86C1" strokeWidth="3" />
          <rect x="6" y="9" width="15" height="7" rx="3.5" fill="#AED6F1" />
          <path d="M26 6 Q30 8 29 14 Q28.5 18 25 19" fill="none" stroke="#F0B429" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "푸꾸옥":
      return (
        <g>
          <path d="M15 10 Q14 18 16 25" stroke="#8B5E3C" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M15 10 Q6 6 2 10 Q8 12 15 10 Z" fill="#3FA55E" />
          <path d="M15 10 Q24 6 28 10 Q22 12 15 10 Z" fill="#4CB96E" />
          <path d="M15 10 Q13 2 6 1 Q10 7 15 10 Z" fill="#4CB96E" />
          <path d="M15 10 Q17 2 24 1 Q20 7 15 10 Z" fill="#3FA55E" />
        </g>
      );
    case "호치민":
      return (
        <g>
          <path d="M3 14 a13 13 0 0 1 26 0 Z" fill="#FFD24D" />
          <path d="M3 14 h26 v3 a2 2 0 0 1 -2 2 h-22 a2 2 0 0 1 -2 -2 Z" fill="#F0B429" />
          <path d="M8 8 Q13 4 18 6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      );
    case "하노이":
      return (
        <g>
          <circle cx="15" cy="13" r="12" fill="#E0483E" />
          <path d="M15 5.5 l2.3 5.2 5.7 .5 -4.3 3.7 1.3 5.6 -5 -3 -5 3 1.3 -5.6 -4.3 -3.7 5.7 -.5 Z" fill="#FFD24D" />
        </g>
      );
    case "달랏":
      return (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="15" cy="6" rx="4.5" ry="7" fill="#F9A8D4" transform={"rotate(" + a + " 15 13)"} />
          ))}
          <circle cx="15" cy="13" r="4.5" fill="#FFD24D" />
        </g>
      );
    case "무이네":
      return (
        <g>
          <path d="M15 1 L26 12 L15 23 L4 12 Z" fill="#FF8A5C" />
          <path d="M15 1 L26 12 L15 12 Z" fill="#FFB088" />
          <path d="M15 23 Q12 27 15 30 Q18 32 16 35" stroke="#E0764A" strokeWidth="1.8" fill="none" />
        </g>
      );
    case "붕따우":
      return (
        <g stroke="#4A5568" strokeWidth="3" fill="none" strokeLinecap="round">
          <circle cx="15" cy="4" r="3" />
          <path d="M15 7 L15 22" />
          <path d="M8 12 h14" />
          <path d="M4 16 Q6 23 15 23 Q24 23 26 16 M4 16 l4 1 M26 16 l-4 1" />
        </g>
      );
    case "하롱베이":
      return (
        <g>
          <path d="M4 20 h24 l-3 5 h-18 Z" fill="#8B5E3C" />
          <path d="M15 2 L15 20" stroke="#5A4C42" strokeWidth="2" />
          <path d="M15 3 Q26 6 24 18 L15 18 Z" fill="#E05B4B" />
          <path d="M17 6 Q22 8 21.5 16 M18.5 4.5 Q25 7 23.5 17" stroke="#B03A32" strokeWidth="1.2" fill="none" />
        </g>
      );
    case "사파":
      return (
        <g>
          <path d="M15 25 Q14 12 15 2" stroke="#7CA843" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {[
            [11, 5, -35], [19, 5, 35], [10, 11, -40], [20, 11, 40], [12, 17, -30], [18, 17, 30],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="2.6" ry="4.6" fill="#F0C948" transform={"rotate(" + r + " " + x + " " + y + ")"} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

export default function MascotIcon({ name, size = 40 }: { name: string; size?: number }) {
  const gid = "mi-" + name.replace(/[^a-zA-Z가-힣]/g, "");
  const plain = name === "전체" || !name;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
      <defs>
        <radialGradient id={gid} cx="0.35" cy="0.3" r="0.95">
          <stop offset="0" stopColor="#FF9A66" />
          <stop offset="0.6" stopColor="#F55B24" />
          <stop offset="1" stopColor="#E04A14" />
        </radialGradient>
      </defs>
      {/* 얼굴 */}
      <circle cx="47" cy="57" r="27" fill={"url(#" + gid + ")"} />
      <ellipse cx="38" cy="48" rx="7" ry="5" fill="#fff" opacity="0.25" />
      {/* 논라 */}
      <path d="M47 15 C50 15 67 29 71 35 L23 35 C27 29 44 15 47 15 Z" fill="#FFE3BC" />
      <path d="M17 35 Q47 44 77 35 Q74 40 47 42 Q20 40 17 35 Z" fill="#F3A469" />
      <path d="M47 17 L47 33" stroke="#F3A469" strokeWidth="1.2" opacity="0.5" />
      <path d="M37 21 L41 33 M57 21 L53 33" stroke="#F3A469" strokeWidth="1" opacity="0.4" />
      {/* 표정 */}
      <circle cx="39" cy="56" r="2.6" fill="#26211C" />
      <circle cx="55" cy="56" r="2.6" fill="#26211C" />
      <circle cx="39.9" cy="55.1" r="0.9" fill="#fff" />
      <circle cx="55.9" cy="55.1" r="0.9" fill="#fff" />
      <path d="M43 63 Q47 66.5 51 63" stroke="#26211C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="33" cy="61" r="3" fill="#FFB3A0" opacity="0.75" />
      <circle cx="61" cy="61" r="3" fill="#FFB3A0" opacity="0.75" />
      {/* 소품 (우하단) */}
      <g transform="translate(60 60) scale(1.15)">
        <Accessory name={plain ? "전체" : name} />
      </g>
    </svg>
  );
}
