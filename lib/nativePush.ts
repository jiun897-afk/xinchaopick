/* 네이티브 앱(APK) 안에서만 동작하는 FCM 푸시 등록 — 웹/PWA에서는 no-op */
import type { SupabaseClient } from "@supabase/supabase-js";
import { playChime } from "./chime";

export async function initNativePush(supabase: SupabaseClient) {
  try {
    const w = window as any;
    const Cap = w.Capacitor;
    if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;
    const PN = Cap.Plugins?.PushNotifications;
    if (!PN || w.__vjNativePushInit) return;
    w.__vjNativePushInit = true;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    // 베자뷰 목소리 알림 채널
    // 주의: 안드로이드는 채널 설정(소리)을 최초 생성 시점 그대로 영구 캐시함.
    // 초기 APK에서 소리 파일 없이 만들어진 'vejaview' 채널이 무음으로 굳은 폰들이 있어
    // 채널을 v2로 재생성 (기존 채널은 삭제)
    try {
      await PN.deleteChannel({ id: "vejaview" });
    } catch {}
    try {
      await PN.createChannel({
        id: "vejaview2",
        name: "베자뷰 알림",
        description: "선정·채팅·오늘 방문 알림",
        importance: 5,
        visibility: 1,
        sound: "vejaview.mp3",
        vibration: true,
      });
    } catch {}

    PN.addListener("registration", async (t: { value: string }) => {
      try {
        await supabase.rpc("save_fcm_token", { p_token: t.value });
      } catch {}
    });
    // 앱을 보고 있는 중에 푸시가 도착하면(실시간 웹소켓이 끊겨 차임을 놓친 경우 대비) 소리 백업
    // playChime 자체 스로틀(1.2초)이 있어 실시간 차임과 이중 재생은 안 됨
    PN.addListener("pushNotificationReceived", () => {
      try {
        playChime();
      } catch {}
    });
    PN.addListener("pushNotificationActionPerformed", (a: any) => {
      const link = a?.notification?.data?.link;
      if (link) window.location.href = link;
    });

    let perm = await PN.checkPermissions();
    if (perm.receive === "prompt") perm = await PN.requestPermissions();
    if (perm.receive !== "granted") return;
    await PN.register();
  } catch {}
}
