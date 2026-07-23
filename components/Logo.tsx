import Link from "next/link";

export default function Logo() {
  return (
    <Link className="hlogo" href="/">
      <span className="mark">
        <svg width="21" height="22" viewBox="0 0 120 124">
          <path d="M60 118 C60 118 30 86 30 61 A30 30 0 1 1 90 61 C90 86 60 118 60 118 Z" fill="#ffffff" />
          <circle cx="60" cy="59" r="12.5" fill="#F55B24" />
          <path d="M60 6 C64 6 88 26 94 34 L26 34 C32 26 56 6 60 6 Z" fill="#FFDDBB" />
          <path d="M18 34 Q60 46 102 34 Q98 40 60 42 Q22 40 18 34 Z" fill="#F3A469" />
        </svg>
      </span>
      <span className="word">
        <span className="kr">씬짜오</span>
        <span className="pickchip">PICK</span>
      </span>
    </Link>
  );
}
