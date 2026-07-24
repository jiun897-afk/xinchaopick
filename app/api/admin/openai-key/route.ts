import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ADMIN_EMAIL = "admin@jmgroup.kr";

/* 운영자 전용: AI 번역 키 등록 (키는 브라우저 → 서버 금고로 직행, Claude/화면 노출 없음) */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const cron = process.env.CRON_SECRET as string;
  if (!url || !anon || !cron) return NextResponse.json({ error: "server not configured" }, { status: 500 });

  const auth = req.headers.get("authorization") ?? "";
  const userRes = await fetch(url + "/auth/v1/user", {
    headers: { apikey: anon, Authorization: auth },
  });
  if (!userRes.ok) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  const user = await userRes.json();
  if (user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: "운영자만 가능해요" }, { status: 403 });

  const { key } = await req.json();
  const k = (key ?? "").trim();
  if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(k)) {
    return NextResponse.json({ error: "OpenAI 키 형식이 아니에요 (sk-로 시작)" }, { status: 400 });
  }

  // 키가 실제로 동작하는지 1회 확인
  const test = await fetch("https://api.openai.com/v1/models?limit=1", {
    headers: { Authorization: "Bearer " + k },
  });
  if (!test.ok) return NextResponse.json({ error: "키가 동작하지 않아요 (OpenAI에서 거부됨)" }, { status: 400 });

  const r = await fetch(url + "/rest/v1/rpc/set_openai_key", {
    method: "POST",
    headers: { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" },
    body: JSON.stringify({ p_secret: cron, p_value: k }),
  });
  if (!r.ok) return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
