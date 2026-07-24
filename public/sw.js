self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch {}
  e.waitUntil(
    self.registration.showNotification(d.title || "베자뷰", {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [80, 40, 120],
      data: { link: d.link || "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(link); return c.focus(); }
      }
      return clients.openWindow(link);
    })
  );
});
