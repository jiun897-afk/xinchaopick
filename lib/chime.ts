/* 새 알림 차임 — 여러 컴포넌트가 동시에 감지해도 5초에 1번만 */
export function playChime() {
  try {
    const w = window as any;
    const now = Date.now();
    if (w.__bvChimeAt && now - w.__bvChimeAt < 5000) return;
    w.__bvChimeAt = now;
    const a = new Audio("/notify.mp3");
    a.volume = 0.55;
    a.play().catch(() => {});
  } catch {}
}
