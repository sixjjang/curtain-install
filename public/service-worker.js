// PWA Service Worker - 앱 업데이트 감지 및 자동 새로고침
const CACHE_NAME = 'curtain-platform-v2';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 열기');
        return cache.addAll(urlsToCache);
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화 중...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에서 찾으면 반환
        if (response) {
          return response;
        }
        
        // 네트워크에서 가져오기
        return fetch(event.request).then((response) => {
          // 유효한 응답이 아니면 그대로 반환
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 응답을 복제하여 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// 앱 업데이트 감지 및 클라이언트에게 알림
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 앱 업데이트 시 모든 클라이언트에게 새로고침 알림
self.addEventListener('controllerchange', () => {
  console.log('새 Service Worker가 활성화되었습니다. 클라이언트들에게 새로고침 알림을 보냅니다.');
  self.clients.claim().then(() => {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'APP_UPDATED',
          message: '앱이 업데이트되었습니다. 새로고침합니다.'
        });
      });
    });
  });
});
