import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function encryptRrn(rrn: string) {
  const key = Buffer.from(process.env.RRN_ENC_KEY as string, "hex");
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(rrn, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const { amount, name, bank, account, rrn, token } = await req.json();
    if (!process.env.RRN_ENC_KEY) {
      return NextResponse.json({ error: "서버 암호화 키가 설정되지 않았어요." }, { status: 500 });
    }
    if (!token) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
    const clean = String(rrn ?? "").replace(/[^0-9]/g, "");
    if (clean.length !== 13) {
      return NextResponse.json({ error: "주민등록번호 13자리를 확인해주세요." }, { status: 400 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const r = await fetch(url + "/rest/v1/rpc/request_withdrawal", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anon, Authorization: "Bearer " + token },
      body: JSON.stringify({
        p_amount: Number(amount),
        p_name: String(name ?? ""),
        p_bank: String(bank ?? ""),
        p_account: String(account ?? ""),
        p_rrn_enc: encryptRrn(clean),
      }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({} as any));
      return NextResponse.json({ error: (e as any).message ?? "출금 신청에 실패했어요." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "요청 처리 중 문제가 생겼어요." }, { status: 500 });
  }
}
