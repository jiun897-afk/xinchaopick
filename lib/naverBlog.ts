/* 네이버 블로그 무료 지표 수집 (서버 전용): RSS + 방문자 위젯 + (선택) 검색 API */

export function parseBlogId(url: string): string | null {
  const m = url.trim().match(/blog\.naver\.com\/([A-Za-z0-9_-]+)/) || url.trim().match(/^([A-Za-z0-9_-]{3,30})$/);
  return m ? m[1] : null;
}

export type BlogStats = {
  blogId: string;
  posts30: number;
  lastPostDays: number | null;
  keywords: string[];
  visitors5d: number | null;
  titles: string[];
  rank?: { keyword: string; rank: number } | null;
};

const STOP = new Set(["그리고", "너무", "정말", "오늘", "후기", "리뷰", "추천", "방문", "다녀왔어요", "솔직", "내돈내산", "일상", "블로그"]);

export async function fetchBlogStats(blogId: string): Promise<BlogStats | null> {
  const res = await fetch("https://rss.blog.naver.com/" + blogId + ".xml", { cache: "no-store" });
  if (!res.ok) return null;
  const xml = await res.text();
  if (!xml.includes("<rss")) return null;

  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, 30);
  const now = Date.now();
  let posts30 = 0;
  let lastPostDays: number | null = null;
  const titles: string[] = [];
  for (const it of items) {
    const chunk = it[1];
    const t = chunk.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || chunk.match(/<title>([\s\S]*?)<\/title>/);
    if (t) titles.push(t[1].trim());
    const d = chunk.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    if (d) {
      const ts = new Date(d[1].trim()).getTime();
      if (!isNaN(ts)) {
        const days = (now - ts) / 86400000;
        if (days <= 30) posts30++;
        if (lastPostDays === null || days < lastPostDays) lastPostDays = Math.floor(days);
      }
    }
  }

  // 제목 기반 키워드 (2글자 이상 단어 빈도)
  const freq: Record<string, number> = {};
  for (const title of titles) {
    for (const w of title.replace(/[\[\](){}<>|,.!?~♥️♡✨:;'"@#%^&*_+=/\\-]/g, " ").split(/\s+/)) {
      if (w.length >= 2 && w.length <= 10 && !STOP.has(w) && !/^\d+$/.test(w)) {
        freq[w] = (freq[w] ?? 0) + 1;
      }
    }
  }
  const keywords = Object.entries(freq)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);

  // 방문자 수 (위젯 공개 시)
  let visitors5d: number | null = null;
  try {
    const v = await fetch("https://blog.naver.com/NVisitorgp4Ajax.naver?blogId=" + blogId, { cache: "no-store" });
    if (v.ok) {
      const vt = await v.text();
      const cnts = Array.from(vt.matchAll(/cnt="(\d+)"/g)).map((m) => Number(m[1]));
      if (cnts.length) visitors5d = cnts.reduce((a, b) => a + b, 0);
    }
  } catch {}

  // (선택) 네이버 검색 API — 키가 있으면 대표 키워드의 블로그탭 순위 확인
  let rank: { keyword: string; rank: number } | null = null;
  const cid = process.env.NAVER_CLIENT_ID;
  const csec = process.env.NAVER_CLIENT_SECRET;
  if (cid && csec && keywords[0]) {
    try {
      const sr = await fetch("https://openapi.naver.com/v1/search/blog.json?display=30&query=" + encodeURIComponent(keywords[0]), {
        headers: { "X-Naver-Client-Id": cid, "X-Naver-Client-Secret": csec },
        cache: "no-store",
      });
      if (sr.ok) {
        const sj = await sr.json();
        const idx = (sj.items ?? []).findIndex((x: any) => (x.link ?? "").includes(blogId));
        if (idx >= 0) rank = { keyword: keywords[0], rank: idx + 1 };
      }
    } catch {}
  }

  return { blogId, posts30, lastPostDays, keywords, visitors5d, titles, rank };
}

export function computeGrade(s: BlogStats): string {
  let score = 0;
  if (s.posts30 >= 12) score += 3;
  else if (s.posts30 >= 8) score += 2;
  else if (s.posts30 >= 3) score += 1;
  if (s.lastPostDays !== null && s.lastPostDays <= 7) score += 1;
  if ((s.visitors5d ?? 0) >= 1500) score += 2;
  else if ((s.visitors5d ?? 0) >= 300) score += 1;
  if (s.rank && s.rank.rank <= 10) score += 2;
  else if (s.rank && s.rank.rank <= 30) score += 1;
  if (score >= 6) return "파워";
  if (score >= 4) return "인기";
  if (score >= 2) return "성장";
  return "새싹";
}
