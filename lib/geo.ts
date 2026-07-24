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

export function fmtDist(m: number): string {
  if (m < 1000) return Math.max(10, Math.round(m / 10) * 10) + "m";
  if (m < 10000) return (m / 1000).toFixed(1) + "km";
  return Math.round(m / 1000) + "km";
}
