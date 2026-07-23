"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../lib/supabase";

type S = "loading" | "guest" | "can" | "applied" | "full" | "busy";

export default function ApplyButton({
  campaignId,
  quota,
  applied,
}: {
  campaignId: string;
  quota: number;
  applied: number;
}) {
  const supabase = getSupabase();
  const [state, setState] = useState<S>("loading");
  const [count, setCount] = useState(applied);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!supabase) {
      setState("guest");
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setState("guest");
        return;
      }
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) setState("applied");
      else if (applied >= quota) setState("full");
      else setState("can");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, campaignId]);

  async function apply() {
    if (!supabase) return;
    setState("busy");
    setMsg("");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setState("guest");
      return;
    }
    const { error } = await supabase
      .from("applications")
      .insert({ campaign_id: campaignId, user_id: session.user.id });
    if (error) {
      if (error.code === "23505") {
        setState("applied");
        return;
      }
      setMsg("신청 중 문제가 생겼어요: " + error.message);
      setState("can");
      return;
    }
    setCount((c) => c + 1);
    setState("applied");
  }

  async function cancel() {
    if (!supabase) return;
    setState("busy");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setState("guest");
      return;
    }
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("user_id", session.user.id);
    if (error) {
      setMsg("취소 중 문제가 생겼어요: " + error.message);
      setState("applied");
      return;
    }
    setCount((c) => Math.max(c - 1, 0));
    setState("can");
  }

  const base: React.CSSProperties = {
    width: "100%",
    padding: "15px 0",
    fontSize: 16,
    borderRadius: 14,
  };

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 10, fontWeight: 700 }}>
        현재 신청 {count}/{quota}명
      </div>
      {state === "loading" && (
        <button className="btn ghost" style={base} disabled>
          확인 중…
        </button>
      )}
      {state === "guest" && (
        <Link className="btn pri" style={{ ...base, display: "flex" }} href="/login">
          로그인하고 신청하기
        </Link>
      )}
      {state === "can" && (
        <button className="btn pri" style={base} onClick={apply}>
          신청하기 — 무료 체험
        </button>
      )}
      {state === "busy" && (
        <button className="btn pri" style={{ ...base, opacity: 0.6 }} disabled>
          처리 중…
        </button>
      )}
      {state === "applied" && (
        <>
          <div
            style={{
              background: "#E8F7EF",
              color: "var(--green)",
              borderRadius: 12,
              padding: "13px 16px",
              fontSize: 14,
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            신청 완료! 선정되면 알려드릴게요
          </div>
          <button
            className="btn ghost"
            style={{ ...base, marginTop: 8, padding: "12px 0", fontSize: 14 }}
            onClick={cancel}
          >
            신청 취소
          </button>
        </>
      )}
      {state === "full" && (
        <button className="btn ghost" style={base} disabled>
          모집이 마감됐어요
        </button>
      )}
      {msg && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: "#C0392B", fontWeight: 700 }}>{msg}</div>
      )}
    </div>
  );
}
