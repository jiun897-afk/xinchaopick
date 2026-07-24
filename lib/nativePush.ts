/* 네이티브 앱(APK) 안에서만 동작하는 FCM 푸시 등록 — 웹/PWA에서는 no-op */
import type { SupabaseClient } from "@supabase/supabase-js";

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
    try {
      await PN.createChannel({
        id: "vejaview",
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
