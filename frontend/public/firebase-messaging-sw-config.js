// Firebase Cloud Messaging Service Worker Configuration
// 이 파일은 서비스 워커에서 사용할 Firebase 설정을 제공합니다

// 환경변수에서 Firebase 설정을 가져오거나 기본값 사용
const getFirebaseConfig = () => {
  // 서비스 워커에서는 환경변수에 직접 접근할 수 없으므로
  // 메인 스크립트에서 전달받거나 하드코딩된 값을 사용
  
  // 방법 1: 하드코딩된 설정 (실제 값으로 교체하세요)
  return {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID", 
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
  // 방법 2: 동적 설정 (메인 스크립트에서 전달받는 경우)
  // return window.FIREBASE_CONFIG || getFirebaseConfig();
};

// 앱 아이콘 경로 설정
const APP_ICONS = {
  icon: '/icon-192x192.png',
  badge: '/badge-72x72.png',
  appleTouchIcon: '/apple-touch-icon.png'
};

// 알림 기본 설정
const NOTIFICATION_DEFAULTS = {
  title: '커튼 설치 매칭',
  body: '새로운 알림이 있습니다.',
  tag: 'default',
  requireInteraction: false,
  silent: false,
  vibrate: [200, 100, 200]
};

// 알림 액션 버튼 설정
const NOTIFICATION_ACTIONS = {
  jobAccept: {
    action: 'accept',
    title: '수락',
    icon: '/icons/accept.png'
  },
  jobReject: {
    action: 'reject', 
    title: '거절',
    icon: '/icons/reject.png'
  },
  viewDetails: {
    action: 'view',
    title: '상세보기',
    icon: '/icons/view.png'
  }
};

// 클릭 액션 URL 매핑
const CLICK_ACTIONS = {
  job: '/jobs/',
  profile: '/profile',
  notifications: '/notifications',
  settings: '/settings',
  home: '/'
};

// 설정 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFirebaseConfig,
    APP_ICONS,
    NOTIFICATION_DEFAULTS,
    NOTIFICATION_ACTIONS,
    CLICK_ACTIONS
  };
} else {
  // 브라우저 환경에서 전역 변수로 설정
  window.FIREBASE_MESSAGING_CONFIG = {
    getFirebaseConfig,
    APP_ICONS,
    NOTIFICATION_DEFAULTS,
    NOTIFICATION_ACTIONS,
    CLICK_ACTIONS
  };
} 