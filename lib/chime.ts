/* 새 알림 차임 — 동시 감지 겹침만 막고(1.2초), 연속 수신은 모두 울림.
   모바일 자동재생 차단 대응: 첫 터치 때 무음 재생으로 오디오 잠금 해제 */

let el: HTMLAudioElement | null = null;

function ensure(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio("/notify.mp3?v=2");
    el.preload = "auto";
    el.volume = 0.9;
  }
  return el;
}

export function initChime() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__bvChimeInit) return;
  w.__bvChimeInit = true;
  const unlock = () => {
    const a = ensure();
    if (!a || w.__bvChimeUnlocked) return;
    a.muted = true;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
        w.__bvChimeUnlocked = true;
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("touchstart", unlock);
      })
      .catch(() => {
        a.muted = false;
      });
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("touchstart", unlock);
}

export function playChime(force = false) {
  try {
    const w = window as any;
    const now = Date.now();
    if (!force && w.__bvChimeAt && now - w.__bvChimeAt < 1200) return;
    w.__bvChimeAt = now;
    const a = ensure();
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}
