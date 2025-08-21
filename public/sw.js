const CACHE_NAME = 'caloriescope-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Add other static assets that should be cached
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Track service worker installation
        fetch('/api/analytics/pwa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'sw_installed',
            platform: 'unknown',
            standalone: false
          })
        }).catch(() => {});
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  // Claim all clients
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests to different origins
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests - always fetch from network
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle different notification types
  const notificationData = event.notification.data || {};
  let targetUrl = '/';
  
  switch (notificationData.type) {
    case 'check-in':
      targetUrl = '/#progress-tracker';
      break;
    case 'meal':
      targetUrl = '/#meal-suggestions';
      break;
    case 'exercise':
      targetUrl = '/#calculator';
      break;
    case 'progress':
      targetUrl = '/#progress-tracker';
      break;
    default:
      targetUrl = '/';
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Open new window if not open
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgressData());
  }
});

async function syncProgressData() {
  try {
    // Get any pending data from IndexedDB or cache
    const cache = await caches.open(CACHE_NAME);
    // Sync logic here
    console.log('Syncing progress data...');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}