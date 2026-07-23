"use client";

import { useRef, useState } from "react";
import { getSupabase } from "../lib/supabase";

const MAX = 10;

/* 이미지 리사이즈 (최대 1600px, jpeg 0.82) — 베트남 네트워크에서도 빠르게 */
function compress(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.82);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function PhotoUploader({
  photos,
  onChange,
  addLabel,
  mainLabel,
}: {
  photos: string[];
  onChange: (urls: string[]) => void;
  addLabel: string;
  mainLabel: string;
}) {
  const supabase = getSupabase();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || !supabase) return;
    setErr("");
    const room = MAX - photos.length;
    const list = Array.from(files).slice(0, room);
    if (list.length === 0) return;
    setBusy(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setBusy(false);
      setErr("로그인이 필요해요 / Cần đăng nhập");
      return;
    }
    const added: string[] = [];
    for (let i = 0; i < list.length; i++) {
      try {
        const blob = await compress(list[i]);
        const path = session.user.id + "/" + Date.now() + "-" + i + ".jpg";
        const { error } = await supabase.storage.from("places").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        const { data } = supabase.storage.from("places").getPublicUrl(path);
        if (data?.publicUrl) added.push(data.publicUrl);
      } catch (e: any) {
        setErr("업로드 실패: " + (e?.message ?? ""));
      }
    }
    if (added.length) onChange([...photos, ...added]);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {photos.map((u, i) => (
          <div key={u} style={{ position: "relative", width: 74, height: 74 }}>
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 12,
                backgroundImage: "url(" + u + ")",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: i === 0 ? "2.5px solid var(--brand)" : "1.5px solid var(--line)",
              }}
            />
            {i === 0 && (
              <span style={{ position: "absolute", left: 3, bottom: 3, background: "var(--brand)", color: "#fff", fontSize: 8.5, fontWeight: 900, borderRadius: 5, padding: "2px 5px" }}>
                {mainLabel}
              </span>
            )}
            <button
              onClick={() => onChange(photos.filter((x) => x !== u))}
              style={{ position: "absolute", right: -6, top: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "var(--ink)", color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer", lineHeight: 1 }}
              aria-label="삭제"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < MAX && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            style={{ width: 74, height: 74, borderRadius: 12, border: "1.5px dashed var(--ink3)", background: "var(--chip)", cursor: "pointer", fontSize: 10.5, fontWeight: 800, color: "var(--ink2)", fontFamily: "inherit", lineHeight: 1.4 }}
          >
            {busy ? "···" : <>＋<br />{addLabel}<br />{photos.length}/{MAX}</>}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
      {err && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#C0392B" }}>{err}</div>}
    </div>
  );
}
