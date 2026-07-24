import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/* 채팅 자동 번역 (한↔베)
   - 로그인한 사용자가 자기 방 메시지만 번역 가능 (RLS로 검증)
   - 이미 번역된 건 msg_tr 캐시에서 바로 반환 → 메시지당 1번만 비용 발생
   - 문맥을 아는 AI 번역(gpt-4o-mini)이라 구글 번역보다 채팅 말투가 자연스러움 */

let keyCache: { v: string; at: number } | null = null;

const hasHangul = (s: string) => /[가-힣]/.test(s);

function needsTr(content: string, target: string) {
  const c = (content ?? "").trim();
  if (!c || c === "📷 사진" || c === "삭제된 메시지입니다") return false;
  if (c.length > 1500) return false;
  if (target === "ko") return !hasHangul(c); // 이미 한국어면 스킵
  return hasHangul(c); // 베트남어 타깃: 한국어일 때만 번역
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const cron = process.env.CRON_SECRET as string;
  if (!url || !anon || !cron) return NextResponse.json({ error: "server not configured" }, { status: 500 });

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const kind = body?.kind === "camp" ? "camp" : "dm";
  const target = body?.target === "vi" ? "vi" : "ko";
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.slice(0, 50) : [];
  if (!ids.length) return NextResponse.json({ map: {} });

  const uhdr = { apikey: anon, Authorization: auth, "Content-Type": "application/json" };

  // 1) 캐시 조회 (내 방 메시지인지 DB에서 검증됨)
  const cachedRes = await fetch(url + "/rest/v1/rpc/get_msg_tr", {
    method: "POST",
    headers: uhdr,
    body: JSON.stringify({ p_kind: kind, p_ids: ids, p_target: target }),
  });
  if (!cachedRes.ok) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  const cached = (await cachedRes.json()) as { msg_id: string; content: string }[];
  const map: Record<string, string> = {};
  cached.forEach((c) => (map[c.msg_id] = c.content));

  // 2) 캐시에 없는 메시지 원문을 내 권한(RLS)으로 조회
  const missing = ids.filter((id) => !map[id]);
  if (missing.length) {
    const table = kind === "camp" ? "messages" : "dm_messages";
    const src = await fetch(
      url + `/rest/v1/${table}?id=in.(${missing.join(",")})&select=id,content`,
      { headers: uhdr }
    );
    if (src.ok) {
      const rows = ((await src.json()) as { id: string; content: string }[]).filter((r) => needsTr(r.content, target));
      if (rows.length) {
        // 3) 번역 키 로드 (5분 캐시)
        if (!keyCache || Date.now() - keyCache.at > 300000) {
          const kr = await fetch(url + "/rest/v1/rpc/get_openai_key", {
            method: "POST",
            headers: { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" },
            body: JSON.stringify({ p_secret: cron }),
          });
          const kv = kr.ok ? await kr.json() : null;
          if (typeof kv === "string" && kv) keyCache = { v: kv, at: Date.now() };
        }
        if (!keyCache) return NextResponse.json({ map, error: "번역 키 미등록" });

        // 4) AI 번역 (문맥 유지, 채팅 말투)
        const langName = target === "ko" ? "Korean" : "Vietnamese";
        const items = rows.map((r, i) => ({ i, text: r.content }));
        try {
          const ai = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: "Bearer " + keyCache.v, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              temperature: 0.2,
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content: `You translate casual chat messages between Korean and Vietnamese for a review-platform messenger. Translate each item into natural, friendly ${langName} exactly as a native speaker would text it. Keep emojis, names, numbers, and URLs as-is. Never add explanations. Reply with JSON: {"t": {"<i>": "<translation>", ...}}`,
                },
                { role: "user", content: JSON.stringify(items) },
              ],
            }),
          });
          if (ai.ok) {
            const j = await ai.json();
            const parsed = JSON.parse(j?.choices?.[0]?.message?.content ?? "{}");
            const t = parsed?.t ?? parsed;
            // 5) 캐시에 저장 (메시지당 1회만 비용)
            await Promise.all(
              rows.map(async (r, i) => {
                const tr = typeof t?.[String(i)] === "string" ? t[String(i)].trim() : null;
                if (!tr) return;
                map[r.id] = tr;
                await fetch(url + "/rest/v1/rpc/set_msg_tr", {
                  method: "POST",
                  headers: uhdr,
                  body: JSON.stringify({ p_kind: kind, p_msg: r.id, p_target: target, p_content: tr }),
                }).catch(() => {});
              })
            );
          }
        } catch {}
      }
    }
  }

  return NextResponse.json({ map });
}
