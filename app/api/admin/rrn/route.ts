import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const ADMIN_EMAIL = "admin@jmgroup.kr";

export async function POST(req: NextRequest) {
  try {
    const { id, token } = await req.json();
    if (!token || !id) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
    if (!process.env.RRN_ENC_KEY) {
      return NextResponse.json({ error: "서버 암호화 키가 설정되지 않았어요." }, { status: 500 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    const user = await fetch(url + "/auth/v1/user", {
      headers: { apikey: anon, Authorization: "Bearer " + token },
    }).then((r) => r.json());
    if (user?.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "운영자만 볼 수 있어요." }, { status: 403 });
    }

    const rows = await fetch(url + "/rest/v1/withdrawals?id=eq." + encodeURIComponent(id) + "&select=rrn_enc", {
      headers: { apikey: anon, Authorization: "Bearer " + token },
    }).then((r) => r.json());
    const encd = Array.isArray(rows) ? rows[0]?.rrn_enc : null;
    if (!encd) return NextResponse.json({ error: "저장된 주민등록번호가 없어요." }, { status: 404 });

    const buf = Buffer.from(encd, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const d = crypto.createDecipheriv("aes-256-gcm", Buffer.from(process.env.RRN_ENC_KEY, "hex"), iv);
    d.setAuthTag(tag);
    const rrn = Buffer.concat([d.update(ct), d.final()]).toString("utf8");
    return NextResponse.json({ rrn: rrn.slice(0, 6) + "-" + rrn.slice(6) });
  } catch {
    return NextResponse.json({ error: "복호화에 실패했어요." }, { status: 500 });
  }
}
