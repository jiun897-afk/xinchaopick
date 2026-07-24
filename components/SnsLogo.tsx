/* SNS 공식 로고 스타일 벡터 아이콘 (간략화 버전) */
export default function SnsLogo({ name, size = 22 }: { name: string; size?: number }) {
  const s = size;
  switch (name) {
    case "블로그": // 네이버 블로그
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="6" fill="#03C75A" />
          <path d="M7 6.5h6.2c2.1 0 3.6 1.2 3.6 3 0 1.3-.7 2.2-1.8 2.6 1.4.3 2.4 1.4 2.4 2.9 0 2-1.6 3.2-3.9 3.2H7V6.5zm5.7 4.7c.9 0 1.5-.5 1.5-1.3s-.6-1.3-1.5-1.3H9.6v2.6h3.1zm.4 4.9c1 0 1.6-.5 1.6-1.4 0-.8-.6-1.4-1.6-1.4H9.6v2.8h3.5z" fill="#fff" />
        </svg>
      );
    case "클립": // 네이버 클립
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="6" fill="#03C75A" />
          <path d="M9.5 7.5v9l7-4.5-7-4.5z" fill="#fff" />
        </svg>
      );
    case "유튜브":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000" />
          <path d="M10 8.8v6.4l5.6-3.2L10 8.8z" fill="#fff" />
        </svg>
      );
    case "쇼츠":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M14.5 2.2 8 5.9c-2 1.1-2.7 3.7-1.5 5.7.4.7 1 1.2 1.7 1.6l-1.7 1c-2 1.1-2.7 3.7-1.6 5.7 1.2 2 3.8 2.7 5.8 1.5l6.5-3.7c2-1.1 2.7-3.7 1.5-5.7-.4-.7-1-1.2-1.7-1.6l1.7-1c2-1.1 2.7-3.7 1.6-5.7-1.2-2-3.8-2.7-5.8-1.5z" fill="#FF0000" />
          <path d="M10 8.7v6.6l5.8-3.3L10 8.7z" fill="#fff" />
        </svg>
      );
    case "인스타":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <defs>
            <linearGradient id="ig1" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#FFD600" />
              <stop offset="0.5" stopColor="#FF0169" />
              <stop offset="1" stopColor="#7638FA" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="7" fill="url(#ig1)" />
          <circle cx="12" cy="12" r="4.6" fill="none" stroke="#fff" strokeWidth="1.9" />
          <circle cx="17.6" cy="6.4" r="1.4" fill="#fff" />
        </svg>
      );
    case "릴스":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <defs>
            <linearGradient id="ig2" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#FFD600" />
              <stop offset="0.5" stopColor="#FF0169" />
              <stop offset="1" stopColor="#7638FA" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="7" fill="url(#ig2)" />
          <path d="M3.5 8h17M9 3.5 12 8M15 3.5 18 8" stroke="#fff" strokeWidth="1.7" />
          <path d="M10.4 11.5v6l5-3-5-3z" fill="#fff" />
        </svg>
      );
    case "페북":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#1877F2" />
          <path d="M13.4 21v-7h2.3l.4-2.8h-2.7v-1.8c0-.8.3-1.4 1.5-1.4h1.3V5.5c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2.3H8.5V14h2.3v7h2.6z" fill="#fff" />
        </svg>
      );
    case "스레드":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="7" fill="#000" />
          <path d="M12.2 5c-3.4 0-5.7 2.3-5.9 6.4-.2 4.4 1.9 7.6 5.8 7.6 3 0 5-1.7 5-4 0-2-1.4-3.2-3.2-3.6.9-2.6-.4-4.1-2.2-4.1-1.5 0-2.6.9-3 2.2l1.7.6c.2-.7.7-1.1 1.3-1.1.9 0 1.3.8.7 2.2-.5 0-1 .1-1.4.2-2 .4-3.1 1.6-3 3.2.1 1.7 1.5 2.7 3.3 2.6 2.3-.1 3.5-1.5 3.8-3.8.8.4 1.3 1 1.3 1.8 0 1.4-1.3 2.4-3.3 2.4-2.8 0-4.3-2.3-4.1-5.9.2-3.3 1.7-4.9 4.2-4.9 1.9 0 3.2.9 3.9 2.4l1.6-.8C17.7 6.2 15.3 5 12.2 5zm.4 8.4c-.2 1.6-.9 2.4-2 2.5-.8 0-1.4-.4-1.4-1 0-.9.8-1.4 2.2-1.5.4 0 .8 0 1.2 0z" fill="#fff" />
        </svg>
      );
    case "X":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="6" fill="#000" />
          <path d="M5.5 5h4.1l3.2 4.6L16.9 5h2.4l-5.4 6.2L19.5 19h-4.1l-3.5-5-4.3 5H5.2l5.8-6.7L5.5 5z" fill="#fff" />
        </svg>
      );
    case "기자단":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="6" fill="#6D28D9" />
          <path d="M6 7h9v10H7.5A1.5 1.5 0 0 1 6 15.5V7z" fill="none" stroke="#fff" strokeWidth="1.7" />
          <path d="M15 10h2.5a.8.8 0 0 1 .8.8v4.7a1.5 1.5 0 0 1-1.5 1.5H15" fill="none" stroke="#fff" strokeWidth="1.7" />
          <path d="M8.2 9.7h4.6M8.2 12h4.6M8.2 14.3h3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
