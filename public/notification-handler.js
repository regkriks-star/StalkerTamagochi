self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const eventAt = event.notification.data?.eventAt;
  const url = new URL("./", self.registration.scope);
  url.searchParams.set("event", String(eventAt));
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const client = windows.find((entry) =>
        entry.url.startsWith(self.registration.scope),
      );
      if (client) {
        await client.focus();
        client.postMessage({ type: "open-event", eventAt });
      } else await self.clients.openWindow(url.href);
    })(),
  );
});
