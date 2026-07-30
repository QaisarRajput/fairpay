importScripts('/workbox-cdn-url.js');

if (self.workbox) {
  self.workbox.core.skipWaiting();
  self.workbox.core.clientsClaim();

  self.workbox.routing.registerRoute(
    ({ request }) => request.destination === 'document',
    new self.workbox.strategies.NetworkFirst({ cacheName: 'fairpay-documents' }),
  );

  self.workbox.routing.registerRoute(
    ({ request }) => request.destination === 'font',
    new self.workbox.strategies.CacheFirst({ cacheName: 'fairpay-fonts' }),
  );

  self.workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/data/cpi/'),
    new self.workbox.strategies.StaleWhileRevalidate({ cacheName: 'fairpay-cpi' }),
  );
}
