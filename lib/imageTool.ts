/* 이미지 압축 (HEIC 자동 변환 포함) — 채팅/후기 등 공용 */
export async function compressImage(f: File | Blob, max = 1280, quality = 0.8): Promise<Blob> {
  let src: Blob = f;
  let bmp = await createImageBitmap(src).catch(() => null);
  if (!bmp) {
    try {
      // @ts-ignore
      const heic2any = (await import("heic2any")).default;
      const out = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.9 });
      src = Array.isArray(out) ? out[0] : out;
      bmp = await createImageBitmap(src).catch(() => null);
    } catch {}
  }
  if (!bmp) throw new Error("이 사진은 읽을 수 없었어요. 다른 사진을 선택해주세요.");
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("사진 변환에 실패했어요."))), "image/jpeg", quality)
  );
}
