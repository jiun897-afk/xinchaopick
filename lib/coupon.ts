export type Coupon = {
  id: string;
  place_id: string;
  kind: "percent" | "amount" | "gift";
  value: number;
  min_spend: number;
  target: string;
  gift: string;
  expires_at: string | null;
  active: boolean;
};

export function couponTitle(c: Coupon): string {
  const scope = c.target ? `${c.target} ` : "";
  if (c.kind === "percent") return `${scope}${c.value}% 할인`;
  if (c.kind === "amount") return `${scope}${c.value.toLocaleString()}₫ 할인`;
  return c.gift || "서비스 증정";
}

export function couponCond(c: Coupon): string {
  const parts: string[] = [];
  if (c.min_spend > 0) parts.push(`${c.min_spend.toLocaleString()}₫ 이상 결제 시`);
  if (c.expires_at) parts.push(`~${c.expires_at.slice(5).replace("-", "/")}`);
  return parts.join(" · ");
}

export function couponValid(c: Coupon): boolean {
  if (!c.active) return false;
  if (c.expires_at && new Date(c.expires_at + "T23:59:59") < new Date()) return false;
  return true;
}
