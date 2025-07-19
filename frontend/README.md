# Install Frontend - FCM Notification System

Next.js 기반의 전문 시공 매칭 플랫폼 프론트엔드입니다. Firebase Cloud Messaging (FCM)을 통한 실시간 알림 시스템을 포함합니다.

## 🚀 주요 기능

- **실시간 알림**: FCM을 통한 푸시 알림
- **작업 주문 관리**: 작업 주문 생성, 조회, 상태 변경
- **반응형 디자인**: 모바일 및 데스크톱 지원
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 모던한 UI 디자인

## 📋 설치 및 설정

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. Firebase 설정

**중요**: 이 애플리케이션은 Firebase Authentication을 사용합니다. Firebase 설정이 필요합니다.

자세한 설정 방법은 [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)를 참조하세요.

#### 빠른 설정:

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. 웹 앱 추가
3. 프로젝트 루트에 `.env.local` 파일 생성:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase VAPID Key (for FCM)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

4. Firebase Console에서 Authentication > 로그인 방법 > 이메일/비밀번호 활성화
5. Firestore Database 생성

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 애플리케이션을 확인할 수 있습니다.

## 🔔 FCM 알림 시스템

### 포그라운드 알림

앱이 열려있을 때 받는 알림은 `_app.tsx`에서 처리됩니다:

```typescript
onMessage(messaging, (payload) => {
  console.log('포그라운드 메시지 수신:', payload);
  showBrowserNotification(payload.notification, payload.data);
});
```

### 백그라운드 알림

앱이 백그라운드에 있을 때 받는 알림은 `firebase-messaging-sw.js`에서 처리됩니다.

### 알림 권한 요청

앱 시작 시 자동으로 알림 권한을 요청합니다:

```typescript
const permission = await Notification.requestPermission();
```

## 📱 알림 타입

### 작업 주문 상태 변경 알림

```typescript
{
  type: 'work_order_status_change',
  workOrderId: 'work-order-123',
  status: '진행중',
  userType: 'worker'
}
```

### 결제 알림

```typescript
{
  type: 'payment_received',
  amount: '150000',
  orderId: 'order-123'
}
```

### 시스템 알림

```typescript
{
  type: 'system_announcement',
  title: '시스템 점검',
  body: '오늘 밤 12시부터 2시간 동안 시스템 점검이 있습니다.'
}
```

## 🛠️ 개발 가이드

### 컴포넌트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── WorkOrderStatusChanger.js
│   └── WorkOrderDetailExample.js
├── pages/              # 페이지 컴포넌트
│   ├── _app.tsx        # 앱 루트 컴포넌트
│   └── WorkOrderDetail.js
├── styles/             # 스타일 파일
│   └── globals.css
└── firebase/           # Firebase 설정
    └── firebase.js
```

### 새로운 알림 타입 추가

1. `_app.tsx`의 `handleCustomNotification` 함수에 새로운 케이스 추가
2. 해당 알림 처리 함수 구현
3. 서비스 워커에서 필요한 경우 추가 처리

### 스타일링

Tailwind CSS를 사용하여 스타일링합니다:

```jsx
<div className="bg-white border rounded-lg shadow-sm p-6">
  <h1 className="text-2xl font-bold text-gray-900">제목</h1>
</div>
```

## 🚀 배포

### Vercel 배포

```bash
npm run build
```

### 환경 변수 설정

배포 플랫폼에서 다음 환경 변수를 설정하세요:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

## 🔧 문제 해결

### 알림이 오지 않는 경우

1. 브라우저 알림 권한 확인
2. FCM 토큰이 서버에 저장되었는지 확인
3. Firebase 설정이 올바른지 확인
4. 서비스 워커가 등록되었는지 확인

### 개발자 도구에서 확인

```javascript
// FCM 토큰 확인
console.log('FCM Token:', fcmToken);

// 알림 권한 확인
console.log('Notification Permission:', Notification.permission);

// 서비스 워커 확인
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

## 📄 라이선스

MIT License

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 