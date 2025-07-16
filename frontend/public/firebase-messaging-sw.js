// Firebase Cloud Messaging Service Worker
// 커튼 설치 매칭 플랫폼용 푸시 알림 서비스 워커

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase 설정
// 실제 값으로 교체하거나 환경변수에서 가져오세요
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN", 
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 초기화
try {
  firebase.initializeApp(firebaseConfig);
  console.log('[firebase-messaging-sw.js] Firebase initialized successfully');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Firebase initialization failed:', error);
}

// Firebase Cloud Messaging 초기화
const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  try {
    // 알림 제목과 내용 추출
    const notificationTitle = payload.notification?.title || 
                             payload.data?.title || 
                             '커튼 설치 매칭';
    
    const notificationBody = payload.notification?.body || 
                            payload.data?.body || 
                            '새로운 알림이 있습니다.';

    // 알림 옵션 설정
    const notificationOptions = {
      body: notificationBody,
      icon: '/icon-192x192.png', // 앱 아이콘 경로
      badge: '/badge-72x72.png', // 배지 아이콘 경로
      tag: payload.data?.tag || 'default', // 알림 그룹화
      requireInteraction: payload.data?.requireInteraction || false, // 사용자 상호작용 필요 여부
      actions: payload.data?.actions || [], // 알림 액션 버튼
      data: {
        ...payload.data,
        click_action: payload.data?.click_action || '/',
        timestamp: Date.now()
      }
    };

    // 커스텀 아이콘이 있는 경우 사용
    if (payload.data?.icon) {
      notificationOptions.icon = payload.data.icon;
    }

    // 커스텀 배지가 있는 경우 사용
    if (payload.data?.badge) {
      notificationOptions.badge = payload.data.badge;
    }

    // 알림 표시
    self.registration.showNotification(notificationTitle, notificationOptions);
    
    console.log('[firebase-messaging-sw.js] Notification displayed successfully');
    
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error displaying notification:', error);
    
    // 기본 알림으로 폴백
    const fallbackOptions = {
      body: '새로운 알림이 있습니다.',
      icon: '/icon-192x192.png',
      data: { fallback: true }
    };
    
    self.registration.showNotification('커튼 설치 매칭', fallbackOptions);
  }
});

// 서비스 워커 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting();
});

// 서비스 워커 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  // 클릭 액션 처리
  const clickAction = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 이미 열린 탭이 있는지 확인
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // 특정 페이지로 이동
          if (clickAction !== '/') {
            client.navigate(clickAction);
          }
          return;
        }
      }
      
      // 새 탭 열기
      if (self.clients.openWindow) {
        return self.clients.openWindow(clickAction);
      }
    })
  );
});

// 알림 닫기 이벤트 처리
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  
  // 알림 닫기 통계나 로깅을 여기에 추가할 수 있습니다
  const notificationData = event.notification.data;
  if (notificationData) {
    console.log('[firebase-messaging-sw.js] Closed notification data:', notificationData);
  }
}); 