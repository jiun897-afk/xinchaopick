import { NextRequest, NextResponse } from "next/server";
import { parseBlogId, fetchBlogStats, computeGrade } from "../../../../lib/naverBlog";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const H = { apikey: anon, Authorization: "Bearer " + anon };

  const rows: { id: string; blog_url: string; blog_verify_code: string | null; blog_verified: boolean }[] = await fetch(
    url + "/rest/v1/profiles?select=id,blog_url,blog_verify_code,blog_verified&blog_url=not.is.null&limit=300",
    { headers: H, cache: "no-store" }
  ).then((r) => r.json());

  let ok = 0,
    fail = 0;
  for (const row of Array.isArray(rows) ? rows : []) {
    try {
      const blogId = parseBlogId(row.blog_url ?? "");
      if (!blogId) continue;
      const stats = await fetchBlogStats(blogId);
      if (!stats) {
        fail++;
        continue;
      }
      let verified = row.blog_verified;
      if (!verified && row.blog_verify_code) verified = stats.titles.some((t) => t.includes(row.blog_verify_code as string));
      const r2 = await fetch(url + "/rest/v1/rpc/set_blog_stats", {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_user: row.id,
          p_grade: computeGrade(stats),
          p_stats: { posts30: stats.posts30, lastPostDays: stats.lastPostDays, keywords: stats.keywords, visitors5d: stats.visitors5d, rank: stats.rank ?? null },
          p_verified: verified,
          p_secret: secret,
        }),
      });
      if (r2.ok) ok++;
      else fail++;
    } catch {
      fail++;
    }
  }
  return NextResponse.json({ ok, fail, total: Array.isArray(rows) ? rows.length : 0 });
}
