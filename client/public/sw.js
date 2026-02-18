const CACHE_NAME = 'xiaoshazi-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index-*.js',
  '/assets/vendor-*.js',
  '/assets/*.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      
      // 网络请求失败时的优雅降级
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(error => {
        // 网络失败时，检查是否为API请求
        const url = new URL(event.request.url);
        const isApiRequest = url.pathname.startsWith('/api/');
        
        console.error('Fetch failed:', event.request.url, error);
        
        // 对于API请求，返回一个简单的错误响应
        if (isApiRequest) {
          return new Response(JSON.stringify({
            error: 'Network error',
            message: 'Unable to reach server',
            success: false
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // 对于静态资源请求，返回一个离线页面或空响应
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        
        // 其他情况返回空响应
        return new Response('Network error', { status: 503 });
      });
    })
  );
});
