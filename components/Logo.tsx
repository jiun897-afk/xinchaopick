import Link from "next/link";

export default function Logo() {
  return (
    <Link className="hlogo" href="/" aria-label="베자뷰 홈">
      <svg width="132" height="32" viewBox="0 0 186 58" style={{ display: "block" }}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF7A45" />
            <stop offset="1" stopColor="#F04E1A" />
          </linearGradient>
        </defs>
        <g transform="translate(0,5) scale(0.40)"><path d="M60 118 C60 118 30 86 30 61 A30 30 0 1 1 90 61 C90 86 60 118 60 118 Z" fill="url(#lg)" /><circle cx="60" cy="59" r="12.5" fill="#fff" /><path d="M60 6 C64 6 88 26 94 34 L26 34 C32 26 56 6 60 6 Z" fill="#FFDDBB" /><path d="M18 34 Q60 46 102 34 Q98 40 60 42 Q22 40 18 34 Z" fill="#F3A469" /></g>
        <g fill="#26211C"><path transform="translate(60.0,46) scale(0.04600,-0.04600)" d="M434 455V760H602V10H434V315H394V30H60V750H207V525H247V750H394V455ZM632 760H800V0H632ZM247 170V385H207V170Z" /><path transform="translate(98.1,46) scale(0.04600,-0.04600)" d="M760 471H835V321H760V0H572V760H760ZM372 571Q372 452 392.0 366.5Q412 281 447.0 235.5Q482 190 527 185L487 30Q433 34 379.0 69.0Q325 104 284 172Q242 104 188.0 69.0Q134 34 80 30L40 185Q120 192 157.5 288.0Q195 384 195 571V600H60V750H506V600H372Z" /><path transform="translate(135.0,46) scale(0.04600,-0.04600)" d="M762 752V321H80V752H268V686H574V752ZM574 471V536H268V471ZM780 270V120H665V0H475V120H362L355 0H175V120H60V270Z" /></g>
        <circle cx="176" cy="44" r="5" fill="url(#lg)" />
      </svg>
    </Link>
  );
}
