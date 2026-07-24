"use client";

import { useEffect, useRef, useState } from "react";

/* 프로필 사진 크롭: 드래그로 이동 + 슬라이더/휠로 확대 (카톡식) */
const V = 280; // 뷰포트(크롭 영역) px

export default function AvatarCrop({ src, onCancel, onDone }: { src: string; onCancel: () => void; onDone: (b: Blob) => void }) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  const [z, setZ] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      imgRef.current = im;
      setDim({ w: im.naturalWidth, h: im.naturalHeight });
    };
    im.src = src;
  }, [src]);

  const s0 = dim ? Math.max(V / dim.w, V / dim.h) : 1;
  const scale = s0 * z;

  function clamp(x: number, y: number, sc: number) {
    if (!dim) return { x, y };
    const minX = V - dim.w * sc;
    const minY = V - dim.h * sc;
    return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  }

  // 이미지 로드/줌 변경 시 중앙 정렬
  useEffect(() => {
    if (!dim) return;
    setPos(clamp((V - dim.w * scale) / 2, (V - dim.h * scale) / 2, scale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dim, z]);

  function down(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  }
  function move(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos(clamp(drag.current.x + (e.clientX - drag.current.px), drag.current.y + (e.clientY - drag.current.py), scale));
  }
  function up() {
    drag.current = null;
  }

  async function confirm() {
    const im = imgRef.current;
    if (!im || !dim) return;
    setBusy(true);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const sx = -pos.x / scale;
    const sy = -pos.y / scale;
    const sw = V / scale;
    ctx.drawImage(im, sx, sy, sw, sw, 0, 0, 512, 512);
    canvas.toBlob(
      (b) => {
        setBusy(false);
        if (b) onDone(b);
      },
      "image/jpeg",
      0.87
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 950, background: "rgba(15,12,10,.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ color: "#fff", fontSize: 15, fontWeight: 900, marginBottom: 16 }}>사진 위치 맞추기</div>

      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onWheel={(e) => setZ((v) => Math.min(3, Math.max(1, v + (e.deltaY < 0 ? 0.08 : -0.08))))}
        style={{ width: V, height: V, position: "relative", overflow: "hidden", borderRadius: 20, touchAction: "none", cursor: "grab", background: "#000" }}
      >
        {dim && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            style={{ position: "absolute", left: pos.x, top: pos.y, width: dim.w * scale, height: dim.h * scale, maxWidth: "none", userSelect: "none", pointerEvents: "none" }}
          />
        )}
        {/* 원형 가이드 */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "0 0 0 999px rgba(0,0,0,.45)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,.9)", pointerEvents: "none" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, width: V }}>
        <span style={{ color: "#bbb", fontSize: 13 }}>－</span>
        <input type="range" min={1} max={3} step={0.01} value={z} onChange={(e) => setZ(Number(e.target.value))} style={{ flex: 1, accentColor: "#F55B24" }} />
        <span style={{ color: "#bbb", fontSize: 16 }}>＋</span>
      </div>
      <div style={{ color: "#999", fontSize: 11.5, marginTop: 6 }}>드래그로 이동 · 슬라이더로 확대</div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="btn ghost" style={{ padding: "12px 26px", background: "transparent", color: "#fff", borderColor: "#555" }} onClick={onCancel} disabled={busy}>
          취소
        </button>
        <button className="btn pri" style={{ padding: "12px 32px" }} onClick={confirm} disabled={busy || !dim}>
          {busy ? "적용 중…" : "적용"}
        </button>
      </div>
    </div>
  );
}
