/* 공용 SVG 아이콘 (이모지 대체) — currentColor 사용 */

function Base({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, verticalAlign: "-2px" }}>
      {children}
    </svg>
  );
}

export function IcGlobe({ size = 14 }: { size?: number }) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Base>
  );
}

export function IcBell({ size = 14 }: { size?: number }) {
  return (
    <Base size={size}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Base>
  );
}

export function IcBellOff({ size = 14 }: { size?: number }) {
  return (
    <Base size={size}>
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      <path d="M18.6 13c-.4-1.3-.6-2.9-.6-5a6 6 0 0 0-9.3-5" />
      <path d="M6.3 6.3C6.1 6.8 6 7.4 6 8c0 7-3 9-3 9h14" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </Base>
  );
}

export function IcTrash({ size = 14 }: { size?: number }) {
  return (
    <Base size={size}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </Base>
  );
}

export function IcExit({ size = 14 }: { size?: number }) {
  return (
    <Base size={size}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Base>
  );
}

export function IcAlert({ size = 14 }: { size?: number }) {
  return (
    <Base size={size}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Base>
  );
}
