// Kill-switch service worker.
//
// An earlier version of this site registered a cache-first service worker at
// /sw.js that kept serving a stale copy of the page (a blank screen until a
// hard refresh). Browsers re-check this URL for updates, so shipping this file
// at the same path replaces the old worker for every returning visitor. It
// deletes all caches, unregisters itself and reloads open tabs from the
// network. The site no longer registers a service worker, but this file must
// stay deployed so visitors who still have the old one recover.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.all(
        windows.map((client) => client.navigate(client.url).catch(() => undefined))
      );
    })()
  );
});
