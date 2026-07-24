import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ADMIN_EMAIL = "admin@jmgroup.kr";

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const cron = process.env.CRON_SECRET as string;
  if (!url || !anon || !cron) return NextResponse.json({ error: "server not configured" }, { status: 500 });

  // 요청자 검증: 운영자 계정 JWT 필수
  const auth = req.headers.get("authorization") ?? "";
  const userRes = await fetch(url + "/auth/v1/user", {
    headers: { apikey: anon, Authorization: auth },
  });
  if (!userRes.ok) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  const user = await userRes.json();
  if (user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: "운영자만 가능해요" }, { status: 403 });

  const { sa } = await req.json();
  try {
    const parsed = JSON.parse(sa);
    if (!parsed.private_key || !parsed.client_email || !parsed.project_id) {
      return NextResponse.json({ error: "서비스 계정 키 파일이 아니에요" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "JSON 파일이 아니에요" }, { status: 400 });
  }

  const r = await fetch(url + "/rest/v1/rpc/set_fcm_sa", {
    method: "POST",
    headers: { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" },
    body: JSON.stringify({ p_secret: cron, p_value: sa }),
  });
  if (!r.ok) return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
