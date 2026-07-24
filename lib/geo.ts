/* 거리 계산(하버사인) + 표시 포맷 */
export function distM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* 방위각(0=북) */
export function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toR = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toR(lng2 - lng1)) * Math.cos(toR(lat2));
  const x =
    Math.cos(toR(lat1)) * Math.sin(toR(lat2)) -
    Math.sin(toR(lat1)) * Math.cos(toR(lat2)) * Math.cos(toR(lng2 - lng1));
  return (Math.atan2(y, x) * 180) / Math.PI < 0
    ? (Math.atan2(y, x) * 180) / Math.PI + 360
    : (Math.atan2(y, x) * 180) / Math.PI;
}

export function dir8(b: number): string {
  const names = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return names[Math.round(b / 45) % 8] + "쪽";
}

export function fmtDist(m: number): string {
  if (m < 1000) return Math.max(10, Math.round(m / 10) * 10) + "m";
  if (m < 10000) return (m / 1000).toFixed(1) + "km";
  return Math.round(m / 1000) + "km";
}
