# 결제 알림 시스템 (Payment Notification System)

## 개요

결제 알림 시스템은 커튼 설치 플랫폼에서 결제 관련 이벤트가 발생할 때 관련 사용자들에게 자동으로 푸시 알림을 발송하는 시스템입니다.

## 주요 기능

- **자동 알림**: 결제 상태 변경 시 자동으로 알림 발송
- **다양한 알림 타입**: 결제 완료, 실패, 대기, 환불, 취소 등
- **템플릿 시스템**: 동적 메시지 생성
- **재시도 로직**: 네트워크 오류 시 자동 재시도
- **로깅 시스템**: 알림 발송 이력 추적
- **다중 사용자 지원**: 여러 사용자에게 동시 알림 발송

## 파일 구조

```
functions/
├── paymentNotificationService.js    # 핵심 알림 서비스
├── onPaymentStatusChanged.js        # Cloud Functions 트리거
├── testPaymentNotifications.js      # 테스트 파일
└── PAYMENT_NOTIFICATION_SYSTEM.md   # 이 문서
```

## 알림 타입

### PAYMENT_NOTIFICATION_TYPES

```javascript
const PAYMENT_NOTIFICATION_TYPES = {
  PAYMENT_COMPLETE: 'payment_complete',     // 결제 완료
  PAYMENT_FAILED: 'payment_failed',         // 결제 실패
  PAYMENT_PENDING: 'payment_pending',       // 결제 대기
  PAYMENT_REFUNDED: 'payment_refunded',     // 환불 완료
  PAYMENT_CANCELLED: 'payment_cancelled',   // 결제 취소
  WORKER_PAYMENT_SENT: 'worker_payment_sent', // 기사 지급 완료
  SETTLEMENT_COMPLETE: 'settlement_complete'   // 정산 완료
};
```

## 핵심 함수들

### 1. sendPaymentNotification(userFcmToken, paymentInfo, notificationType)

단일 FCM 토큰으로 결제 알림을 발송합니다.

```javascript
const { sendPaymentNotification, PAYMENT_NOTIFICATION_TYPES } = require('./paymentNotificationService');

const paymentInfo = {
  workOrderId: 'WO_20241201_001',
  paymentId: 'PAY_20241201_001',
  amount: 150000,
  currency: 'KRW',
  sellerId: 'seller123',
  workerId: 'worker456'
};

await sendPaymentNotification(
  'user_fcm_token_here',
  paymentInfo,
  PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE
);
```

### 2. sendPaymentNotificationToUser(userId, paymentInfo, notificationType)

사용자 ID로 결제 알림을 발송합니다 (FCM 토큰을 자동으로 조회).

```javascript
const { sendPaymentNotificationToUser } = require('./paymentNotificationService');

await sendPaymentNotificationToUser(
  'user123',
  paymentInfo,
  PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE
);
```

### 3. sendPaymentNotificationToUsers(userIds, paymentInfo, notificationType)

여러 사용자에게 동시에 결제 알림을 발송합니다.

```javascript
const { sendPaymentNotificationToUsers } = require('./paymentNotificationService');

const userIds = ['user1', 'user2', 'user3'];

const results = await sendPaymentNotificationToUsers(
  userIds,
  paymentInfo,
  PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE
);

console.log('발송 결과:', results);
// [
//   { userId: 'user1', success: true, messageId: 'msg123' },
//   { userId: 'user2', success: false, error: 'Invalid token' },
//   { userId: 'user3', success: true, messageId: 'msg124' }
// ]
```

### 4. notifyPaymentStatusChange(workOrderId, paymentStatus, paymentInfo)

작업 주문의 결제 상태 변경 시 관련자들에게 알림을 발송합니다.

```javascript
const { notifyPaymentStatusChange } = require('./paymentNotificationService');

await notifyPaymentStatusChange(
  'WO_20241201_001',
  'paid',
  paymentInfo
);
```

## Cloud Functions

### 1. onPaymentStatusChanged

`payments` 컬렉션의 문서가 업데이트될 때 자동으로 트리거됩니다.

```javascript
// Firestore에서 payments 문서 업데이트 시 자동 실행
exports.onPaymentStatusChanged = functions.firestore
  .document('payments/{paymentId}')
  .onUpdate(async (change, context) => {
    // 결제 상태 변경 감지 및 알림 발송
  });
```

### 2. onWorkOrderPaymentStatusChanged

`workOrders` 컬렉션의 결제 상태가 변경될 때 자동으로 트리거됩니다.

```javascript
// Firestore에서 workOrders 문서의 paymentStatus 필드 변경 시 자동 실행
exports.onWorkOrderPaymentStatusChanged = functions.firestore
  .document('workOrders/{workOrderId}')
  .onUpdate(async (change, context) => {
    // 작업 주문 결제 상태 변경 감지 및 알림 발송
  });
```

### 3. onSettlementCompleted

`settlements` 컬렉션에 새 문서가 생성될 때 자동으로 트리거됩니다.

```javascript
// Firestore에서 settlements 컬렉션에 새 문서 생성 시 자동 실행
exports.onSettlementCompleted = functions.firestore
  .document('settlements/{settlementId}')
  .onCreate(async (snap, context) => {
    // 정산 완료 감지 및 알림 발송
  });
```

### 4. sendPaymentNotification (HTTP 함수)

수동으로 결제 알림을 발송할 수 있는 HTTP 함수입니다.

```javascript
// 클라이언트에서 호출
const { httpsCallable } = require('firebase/functions');
const sendPaymentNotification = httpsCallable(functions, 'sendPaymentNotification');

const result = await sendPaymentNotification({
  userId: 'user123',
  paymentInfo: {
    workOrderId: 'WO_20241201_001',
    amount: 150000
  },
  notificationType: 'payment_complete'
});
```

## 데이터 구조

### PaymentInfo 객체

```javascript
{
  workOrderId: string,        // 작업 주문 ID
  paymentId: string,          // 결제 ID
  amount: number,             // 결제 금액
  currency: string,           // 통화 (기본값: 'KRW')
  sellerId: string,           // 판매자 ID
  workerId: string,           // 기사 ID
  paymentMethod: string,      // 결제 방법
  urgentFee: number,          // 긴급 수수료
  platformFee: number,        // 플랫폼 수수료
  workerPayment: number,      // 기사 지급액
  timestamp: Date             // 타임스탬프
}
```

### Firestore 컬렉션 구조

#### payments/{paymentId}
```javascript
{
  workOrderId: 'WO_20241201_001',
  amount: 150000,
  currency: 'KRW',
  status: 'paid', // paid, failed, pending, refunded, cancelled
  sellerId: 'seller123',
  workerId: 'worker456',
  paymentMethod: 'card',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### workOrders/{workOrderId}
```javascript
{
  sellerId: 'seller123',
  workerId: 'worker456',
  paymentStatus: 'paid', // paid, failed, pending, refunded, cancelled
  paymentDetails: {
    totalFee: 150000,
    urgentFee: 15000,
    platformFee: 7500,
    workerPayment: 127500,
    paidAt: Timestamp
  },
  baseFee: 120000,
  urgentFeePercent: 12.5,
  platformFeePercent: 5
}
```

#### settlements/{settlementId}
```javascript
{
  period: '2024-12',
  totalAmount: 1500000,
  workerCount: 5,
  workOrderCount: 10,
  userIds: ['user1', 'user2', 'user3'],
  createdAt: Timestamp
}
```

## 템플릿 시스템

알림 메시지는 템플릿을 사용하여 동적으로 생성됩니다.

### 템플릿 예시

```javascript
const PAYMENT_NOTIFICATION_TEMPLATES = {
  [PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE]: {
    title: "결제 완료 알림",
    body: "작업 ID {workOrderId}의 결제가 완료되었습니다.",
    category: LOG_CATEGORIES.PAYMENT
  }
};
```

### 변수 치환

템플릿의 `{변수명}` 형태는 실제 데이터로 치환됩니다.

```javascript
// 입력
const template = "작업 ID {workOrderId}의 결제가 완료되었습니다.";
const variables = { workOrderId: 'WO_20241201_001' };

// 출력
"작업 ID WO_20241201_001의 결제가 완료되었습니다."
```

## 테스트

### 테스트 실행

```bash
# 전체 테스트 실행
node testPaymentNotifications.js

# 특정 테스트 실행
node testPaymentNotifications.js basic
node testPaymentNotifications.js status
node testPaymentNotifications.js user
```

### 테스트 종류

1. **basic**: 기본 결제 완료 알림 테스트
2. **status**: 다양한 결제 상태 알림 테스트
3. **user**: 사용자 ID로 알림 발송 테스트
4. **multiple**: 여러 사용자에게 알림 발송 테스트
5. **statusChange**: 결제 상태 변경 알림 테스트
6. **settlement**: 정산 완료 알림 테스트
7. **token**: FCM 토큰 조회 테스트
8. **template**: 템플릿 변수 치환 테스트

## 설정

### 환경 변수

```bash
# Firebase 프로젝트 설정
FIREBASE_PROJECT_ID=your-project-id

# FCM 설정
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
```

### Firebase Console 설정

1. **Cloud Messaging 활성화**
   - Firebase Console → 프로젝트 설정 → Cloud Messaging
   - 웹 푸시 인증서 생성

2. **Firestore 보안 규칙**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /payments/{paymentId} {
         allow read, write: if request.auth != null;
       }
       match /workOrders/{workOrderId} {
         allow read, write: if request.auth != null;
       }
       match /settlements/{settlementId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 오류 처리

### 재시도 로직

네트워크 오류 시 최대 3회까지 자동 재시도합니다.

```javascript
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};
```

### 로깅

모든 알림 발송은 로깅 시스템에 기록됩니다.

```javascript
// 성공 로그
await logSuccess(
  userId,
  LOG_TYPES.PUSH,
  LOG_CATEGORIES.PAYMENT,
  '결제 알림 발송 완료',
  metadata
);

// 실패 로그
await logFailure(
  userId,
  LOG_TYPES.PUSH,
  LOG_CATEGORIES.PAYMENT,
  '결제 알림 발송 실패',
  error,
  metadata
);
```

## 사용 예시

### 1. 결제 완료 시 알림 발송

```javascript
// 결제 완료 처리 후
const paymentInfo = {
  workOrderId: 'WO_20241201_001',
  paymentId: 'PAY_20241201_001',
  amount: 150000,
  sellerId: 'seller123',
  workerId: 'worker456'
};

// 판매자에게 알림
await sendPaymentNotificationToUser(
  'seller123',
  paymentInfo,
  PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE
);

// 기사에게 알림
await sendPaymentNotificationToUser(
  'worker456',
  paymentInfo,
  PAYMENT_NOTIFICATION_TYPES.WORKER_PAYMENT_SENT
);
```

### 2. 결제 실패 시 알림 발송

```javascript
const paymentInfo = {
  workOrderId: 'WO_20241201_001',
  paymentId: 'PAY_20241201_001',
  amount: 150000,
  sellerId: 'seller123'
};

await sendPaymentNotificationToUser(
  'seller123',
  paymentInfo,
  PAYMENT_NOTIFICATION_TYPES.PAYMENT_FAILED
);
```

### 3. 정산 완료 시 알림 발송

```javascript
const settlementInfo = {
  settlementId: 'SETTLE_20241201_001',
  period: '2024-12',
  totalAmount: 1500000,
  workerCount: 5,
  workOrderCount: 10
};

const userIds = ['worker1', 'worker2', 'worker3', 'worker4', 'worker5'];

await sendPaymentNotificationToUsers(
  userIds,
  settlementInfo,
  PAYMENT_NOTIFICATION_TYPES.SETTLEMENT_COMPLETE
);
```

## 모니터링

### Cloud Functions 로그

Firebase Console → Functions → 로그에서 알림 발송 상태를 확인할 수 있습니다.

### 알림 통계

```javascript
// 알림 발송 통계 조회
const stats = await getNotificationStats();
console.log('알림 통계:', stats);
```

## 문제 해결

### 일반적인 문제들

1. **FCM 토큰이 없음**
   - 사용자가 알림 권한을 허용하지 않았거나 토큰이 만료됨
   - 해결: 토큰 재발급 요청

2. **알림이 발송되지 않음**
   - Firebase 프로젝트 설정 확인
   - FCM 서비스 계정 키 확인

3. **잘못된 알림 타입**
   - `PAYMENT_NOTIFICATION_TYPES`에 정의된 타입 사용
   - 해결: 올바른 알림 타입 지정

### 디버깅

```javascript
// 디버그 모드 활성화
const DEBUG = true;

if (DEBUG) {
  console.log('결제 정보:', paymentInfo);
  console.log('알림 타입:', notificationType);
  console.log('FCM 토큰:', fcmToken);
}
```

## 성능 최적화

### 배치 처리

여러 알림을 동시에 발송할 때는 `sendPaymentNotificationToUsers`를 사용하세요.

### 캐싱

FCM 토큰은 캐시하여 중복 조회를 방지하세요.

### 비동기 처리

알림 발송은 비동기로 처리하여 메인 프로세스를 차단하지 않도록 하세요.

## 보안

### 인증 확인

HTTP 함수는 반드시 인증을 확인합니다.

```javascript
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
}
```

### 데이터 검증

입력 데이터를 검증하여 악의적인 데이터를 방지합니다.

```javascript
if (!userId || !paymentInfo) {
  throw new functions.https.HttpsError('invalid-argument', '필수 매개변수가 누락되었습니다.');
}
```

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 