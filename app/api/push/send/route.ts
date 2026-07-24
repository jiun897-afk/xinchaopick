import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return NextResponse.json({ error: "vapid not set" }, { status: 500 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:help@vejaview.com", pub, priv);

  const { user_id, title, body, link } = await req.json();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const H = { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" };

  const subs = await fetch(url + "/rest/v1/rpc/get_push_subs", {
    method: "POST",
    headers: H,
    body: JSON.stringify({ p_user: user_id, p_secret: secret }),
  }).then((r) => (r.ok ? r.json() : []));

  let sent = 0;
  for (const s of Array.isArray(subs) ? subs : []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body, link })
      );
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await fetch(url + "/rest/v1/rpc/del_push_sub", {
          method: "POST",
          headers: H,
          body: JSON.stringify({ p_endpoint: s.endpoint, p_secret: secret }),
        }).catch(() => {});
      }
    }
  }
  return NextResponse.json({ sent });
}
