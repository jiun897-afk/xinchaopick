import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import crypto from "crypto";

export const runtime = "nodejs";

/* ── FCM v1 (네이티브 앱 푸시) ── */
function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let fcmTokCache: { token: string; exp: number } | null = null;

async function fcmAccessToken(sa: any): Promise<string | null> {
  try {
    if (fcmTokCache && Date.now() < fcmTokCache.exp - 60000) return fcmTokCache.token;
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = b64url(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    );
    const sig = crypto.createSign("RSA-SHA256").update(header + "." + claim).sign(sa.private_key);
    const jwt = header + "." + claim + "." + b64url(sig);
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt,
    });
    if (!res.ok) return null;
    const j = await res.json();
    fcmTokCache = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
    return j.access_token;
  } catch {
    return null;
  }
}

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
  // ── 네이티브 앱(FCM) 발송 ──
  let fcmSent = 0;
  let saRaw = process.env.FCM_SA;
  if (!saRaw) {
    // env에 없으면 DB 금고(app_secrets)에서 조회
    saRaw = await fetch(url + "/rest/v1/rpc/get_fcm_sa", {
      method: "POST",
      headers: H,
      body: JSON.stringify({ p_secret: secret }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  if (saRaw) {
    try {
      const sa = JSON.parse(saRaw);
      const at = await fcmAccessToken(sa);
      if (at) {
        const toks = await fetch(url + "/rest/v1/rpc/get_fcm_tokens", {
          method: "POST",
          headers: H,
          body: JSON.stringify({ p_user: user_id, p_secret: secret }),
        }).then((r) => (r.ok ? r.json() : []));
        for (const t of Array.isArray(toks) ? toks : []) {
          const res = await fetch("https://fcm.googleapis.com/v1/projects/" + sa.project_id + "/messages:send", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + at },
            body: JSON.stringify({
              message: {
                token: t.token,
                notification: { title, body },
                data: { link: link ?? "/" },
                android: {
                  notification: { channel_id: "vejaview", sound: "vejaview" },
                  priority: "HIGH",
                },
              },
            }),
          });
          if (res.ok) fcmSent++;
          else if (res.status === 404 || res.status === 400) {
            await fetch(url + "/rest/v1/rpc/del_fcm_token", {
              method: "POST",
              headers: H,
              body: JSON.stringify({ p_token: t.token, p_secret: secret }),
            }).catch(() => {});
          }
        }
      }
    } catch {}
  }

  return NextResponse.json({ sent, fcmSent });
}
