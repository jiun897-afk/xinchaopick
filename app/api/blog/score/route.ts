import { NextRequest, NextResponse } from "next/server";
import { parseBlogId, fetchBlogStats, computeGrade } from "../../../../lib/naverBlog";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { token, blogUrl } = await req.json();
    if (!token) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const H = { apikey: anon, Authorization: "Bearer " + token };

    const user = await fetch(url + "/auth/v1/user", { headers: H }).then((r) => r.json());
    if (!user?.id) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

    const prof = (
      await fetch(url + "/rest/v1/profiles?id=eq." + user.id + "&select=blog_url,blog_verify_code,blog_verified", { headers: H }).then((r) => r.json())
    )?.[0];

    const target = (blogUrl ?? prof?.blog_url ?? "").trim();
    const blogId = parseBlogId(target);
    if (!blogId) return NextResponse.json({ error: "블로그 주소를 확인해주세요. (예: blog.naver.com/아이디)" }, { status: 400 });

    const stats = await fetchBlogStats(blogId);
    if (!stats) return NextResponse.json({ error: "블로그를 찾을 수 없어요. 주소를 다시 확인해주세요." }, { status: 404 });

    let verified = !!prof?.blog_verified;
    if (!verified && prof?.blog_verify_code) {
      verified = stats.titles.some((t) => t.includes(prof.blog_verify_code));
    }

    const grade = computeGrade(stats);
    const save = {
      blog_url: "https://blog.naver.com/" + blogId,
      blog_grade: grade,
      blog_verified: verified,
      blog_stats: {
        posts30: stats.posts30,
        lastPostDays: stats.lastPostDays,
        keywords: stats.keywords,
        visitors5d: stats.visitors5d,
        rank: stats.rank ?? null,
      },
      blog_checked_at: new Date().toISOString(),
    };
    const pr = await fetch(url + "/rest/v1/profiles?id=eq." + user.id, {
      method: "PATCH",
      headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(save),
    });
    if (!pr.ok) return NextResponse.json({ error: "저장에 실패했어요." }, { status: 500 });

    return NextResponse.json({ grade, verified, stats: save.blog_stats });
  } catch {
    return NextResponse.json({ error: "확인 중 문제가 생겼어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
