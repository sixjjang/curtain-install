# Firebase Cloud Messaging (FCM) 설정 가이드

## 개요

이 가이드는 커튼 설치 매칭 플랫폼에서 Firebase Cloud Messaging을 설정하고 사용하는 방법을 설명합니다.

## 1. Firebase 프로젝트 설정

### 1.1 Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 웹 앱 추가

### 1.2 Firebase 설정 파일
`frontend/src/firebase/firebase.js` 파일에 Firebase 설정을 추가:

```javascript
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export default app;
```

### 1.3 VAPID 키 생성
1. Firebase Console → 프로젝트 설정 → 클라우드 메시징
2. 웹 푸시 인증서 생성
3. 생성된 키를 환경변수에 추가:

```env
REACT_APP_FCM_VAPID_KEY=YOUR_WEB_PUSH_CERTIFICATE_KEY_PAIR
```

## 2. 서비스 워커 설정

### 2.1 서비스 워커 파일
`frontend/public/firebase-messaging-sw.js` 파일이 자동으로 생성됩니다:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지 수신:', payload);
  
  const notificationTitle = payload.notification?.title || '커튼 설치 매칭';
  const notificationOptions = {
    body: payload.notification?.body || '새로운 알림이 있습니다.',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.tag || 'default',
    requireInteraction: payload.data?.requireInteraction || false,
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const clickAction = event.notification.data?.click_action;
  if (clickAction) {
    event.waitUntil(
      clients.openWindow(clickAction)
    );
  }
});
```

### 2.2 서비스 워커 설정 파일
`frontend/public/firebase-messaging-sw-config.js` 파일:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export default firebaseConfig;
```

## 3. FCM 핸들러 컴포넌트

### 3.1 FCM 핸들러 사용
`frontend/src/components/FcmHandler.js` 컴포넌트를 앱의 최상위 레벨에서 사용:

```javascript
import FcmHandler from './components/FcmHandler';

function App() {
  return (
    <div>
      <FcmHandler />
      {/* 다른 컴포넌트들 */}
    </div>
  );
}
```

### 3.2 FCM 토큰 관리 훅
`frontend/src/hooks/useFCMToken.js` 훅을 사용하여 토큰 관리:

```javascript
import useFCMToken from '../hooks/useFCMToken';

function MyComponent() {
  const {
    token,
    loading,
    error,
    permission,
    saveToken,
    deleteToken,
    validateToken,
    requestPermission
  } = useFCMToken();

  // 토큰 저장
  const handleSaveToken = async (fcmToken) => {
    try {
      await saveToken(fcmToken);
      console.log('토큰이 저장되었습니다.');
    } catch (error) {
      console.error('토큰 저장 실패:', error);
    }
  };

  return (
    <div>
      <p>FCM 토큰: {token ? '있음' : '없음'}</p>
      <p>권한: {permission}</p>
      {error && <p>에러: {error}</p>}
    </div>
  );
}
```

## 4. Firebase Functions 설정

### 4.1 FCM 토큰 관리 함수
`functions/fcmTokenManager.js` 파일에 토큰 관리 함수들이 포함되어 있습니다:

- `saveFCMToken`: FCM 토큰 저장
- `deleteFCMToken`: FCM 토큰 삭제
- `validateFCMToken`: 토큰 유효성 검증
- `getFCMToken`: 사용자별 토큰 조회
- `cleanupExpiredTokens`: 만료된 토큰 정리 (관리자용)
- `getFCMTokenStats`: FCM 토큰 통계 (관리자용)

### 4.2 함수 배포
```bash
cd functions
npm install
firebase deploy --only functions
```

## 5. 알림 전송

### 5.1 서버에서 알림 전송
Firebase Admin SDK를 사용하여 알림 전송:

```javascript
const admin = require('firebase-admin');

// 사용자별 알림 전송
async function sendNotificationToUser(userId, notification) {
  try {
    // 사용자의 FCM 토큰 조회
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;
    
    if (fcmToken) {
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            click_action: notification.click_action
          }
        }
      };
      
      const response = await admin.messaging().send(message);
      console.log('알림 전송 성공:', response);
      return response;
    }
  } catch (error) {
    console.error('알림 전송 실패:', error);
    throw error;
  }
}
```

### 5.2 토픽 기반 알림 전송
```javascript
// 특정 토픽에 가입된 모든 사용자에게 알림 전송
async function sendNotificationToTopic(topic, notification) {
  try {
    const message = {
      topic: topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {}
    };
    
    const response = await admin.messaging().send(message);
    console.log('토픽 알림 전송 성공:', response);
    return response;
  } catch (error) {
    console.error('토픽 알림 전송 실패:', error);
    throw error;
  }
}
```

## 6. 알림 타입별 처리

### 6.1 등급 변경 알림
```javascript
// 등급 상승 알림
const gradeUpgradeNotification = {
  title: '🎉 등급 상승 축하드립니다!',
  body: '실버에서 골드로 등급이 상승했습니다!',
  data: {
    type: 'grade_upgrade',
    oldLevel: '2',
    newLevel: '3',
    oldGradeName: '실버',
    newGradeName: '골드'
  },
  click_action: '/grade-benefits'
};

// 등급 하락 알림
const gradeDowngradeNotification = {
  title: '등급 변경 안내',
  body: '골드에서 실버로 등급이 변경되었습니다.',
  data: {
    type: 'grade_downgrade',
    oldLevel: '3',
    newLevel: '2',
    oldGradeName: '골드',
    newGradeName: '실버'
  },
  click_action: '/improvement-guide'
};
```

### 6.2 작업 관련 알림
```javascript
// 새 작업 매칭 알림
const newJobNotification = {
  title: '새로운 작업이 매칭되었습니다!',
  body: '서울시 강남구 커튼 설치 작업이 등록되었습니다.',
  data: {
    type: 'new_job',
    jobId: 'job_123',
    location: '서울시 강남구',
    estimatedPrice: '150,000원'
  },
  click_action: '/jobs/job_123'
};

// 작업 수락 알림
const jobAcceptedNotification = {
  title: '작업이 수락되었습니다!',
  body: '커튼 설치 작업이 계약자에 의해 수락되었습니다.',
  data: {
    type: 'job_accepted',
    jobId: 'job_123',
    contractorId: 'contractor_456'
  },
  click_action: '/jobs/job_123/details'
};
```

## 7. 테스트 및 디버깅

### 7.1 FCM 예제 컴포넌트
`frontend/src/components/FCMExample.js` 컴포넌트를 사용하여 FCM 기능을 테스트할 수 있습니다:

```javascript
import FCMExample from './components/FCMExample';

function TestPage() {
  return (
    <div>
      <h1>FCM 테스트</h1>
      <FCMExample />
    </div>
  );
}
```

### 7.2 브라우저 개발자 도구
1. F12를 눌러 개발자 도구 열기
2. Console 탭에서 FCM 관련 로그 확인
3. Application 탭에서 서비스 워커 상태 확인

### 7.3 알림 권한 확인
```javascript
// 알림 권한 상태 확인
console.log('알림 권한:', Notification.permission);

// 권한 요청
Notification.requestPermission().then(permission => {
  console.log('권한 결과:', permission);
});
```

## 8. 성능 최적화

### 8.1 토큰 관리
- 사용자 로그인/로그아웃 시 토큰 자동 관리
- 만료된 토큰 정기적 정리
- 토큰 유효성 검증

### 8.2 알림 최적화
- 적절한 알림 빈도 설정
- 사용자 선호도 기반 알림 필터링
- 알림 그룹화 및 요약

### 8.3 에러 처리
- 네트워크 오류 처리
- 토큰 만료 처리
- 재시도 로직 구현

## 9. 보안 고려사항

### 9.1 토큰 보안
- FCM 토큰은 민감한 정보로 취급
- 서버에서만 토큰 저장 및 관리
- HTTPS 통신 필수

### 9.2 권한 관리
- 사용자별 알림 권한 확인
- 관리자 권한 검증
- 토큰 접근 제어

### 9.3 데이터 보호
- 개인정보 포함 알림 주의
- 암호화된 데이터 전송
- 로그 데이터 보안

## 10. 모니터링 및 분석

### 10.1 알림 전송 통계
- 전송 성공률 모니터링
- 사용자 참여도 분석
- 알림 효과 측정

### 10.2 에러 모니터링
- 토큰 오류 추적
- 전송 실패 원인 분석
- 성능 지표 수집

## 11. 문제 해결

### 11.1 일반적인 문제들

#### 알림이 표시되지 않는 경우
1. 브라우저 알림 권한 확인
2. 서비스 워커 등록 상태 확인
3. FCM 토큰 유효성 검증
4. 네트워크 연결 상태 확인

#### 토큰 생성 실패
1. VAPID 키 설정 확인
2. Firebase 설정 검증
3. 브라우저 호환성 확인
4. 개발자 도구에서 오류 로그 확인

#### 백그라운드 알림이 작동하지 않는 경우
1. 서비스 워커 파일 경로 확인
2. 서비스 워커 등록 상태 확인
3. 브라우저 캐시 클리어
4. HTTPS 환경에서 테스트

### 11.2 디버깅 도구
- Firebase Console의 Cloud Messaging 섹션
- 브라우저 개발자 도구
- 서비스 워커 개발자 도구
- FCM 디버깅 라이브러리

## 12. 추가 리소스

- [Firebase Cloud Messaging 공식 문서](https://firebase.google.com/docs/cloud-messaging)
- [웹 푸시 알림 가이드](https://web.dev/push-notifications/)
- [서비스 워커 API 문서](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)

## 13. 업데이트 로그

### v1.0.0 (2024-01-XX)
- 초기 FCM 설정 및 기본 기능 구현
- FCM 핸들러 컴포넌트 추가
- 토큰 관리 훅 구현
- Firebase Functions 통합
- 서비스 워커 설정 완료
- 예제 컴포넌트 및 테스트 기능 추가 