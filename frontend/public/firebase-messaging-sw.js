// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase 설정
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// 메시징 인스턴스 가져오기
const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '알림';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.workOrderId || 'general',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: '보기',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/favicon.ico'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  // 알림 표시
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭:', event);

  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  if (action === 'close') {
    return;
  }

  // 기본 동작: 알림 데이터에 따른 페이지 이동
  let urlToOpen = '/';

  if (data?.workOrderId) {
    urlToOpen = `/workorder/${data.workOrderId}`;
  } else if (data?.click_action) {
    urlToOpen = data.click_action;
  }

  // 클라이언트 창 열기
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있는지 확인
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      // 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 알림 닫기 이벤트 처리
self.addEventListener('notificationclose', (event) => {
  console.log('알림 닫힘:', event);
  
  // 알림 분석 데이터 전송 (선택사항)
  const data = event.notification.data;
  if (data?.workOrderId) {
    // 알림 닫기 이벤트를 서버에 전송
    fetch('/api/analytics/notification-closed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workOrderId: data.workOrderId,
        notificationType: data.type,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('알림 닫기 이벤트 전송 실패:', error);
    });
  }
});

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  console.log('Firebase Messaging Service Worker 설치됨');
  self.skipWaiting();
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  console.log('Firebase Messaging Service Worker 활성화됨');
  event.waitUntil(self.clients.claim());
});

// 푸시 이벤트 처리 (기본 푸시 알림용)
self.addEventListener('push', (event) => {
  console.log('푸시 이벤트 수신:', event);

  if (event.data) {
    const data = event.data.json();
    const notificationTitle = data.notification?.title || '알림';
    const notificationOptions = {
      body: data.notification?.body || '',
      icon: data.notification?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.data?.workOrderId || 'general',
      data: data.data,
      requireInteraction: true
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  }
}); 