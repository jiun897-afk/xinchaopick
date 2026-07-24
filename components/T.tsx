"use client";
/* 인라인 번역 스위치 — 서버 컴포넌트 안에서도 <T ko="…" vi="…" />로 사용 */
import type { ReactNode } from "react";
import { useLang } from "../lib/i18n";

export default function T({ ko, vi }: { ko: ReactNode; vi: ReactNode }) {
  const [lang] = useLang();
  return <>{lang === "vi" ? vi : ko}</>;
}
