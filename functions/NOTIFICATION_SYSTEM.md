# 푸시 알림 시스템 가이드

이 문서는 커튼 설치 플랫폼의 Firebase Cloud Messaging (FCM) 푸시 알림 시스템에 대한 상세한 가이드입니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [설치 및 설정](#설치-및-설정)
3. [사용법](#사용법)
4. [오류 처리](#오류-처리)
5. [테스트](#테스트)
6. [모니터링](#모니터링)
7. [트러블슈팅](#트러블슈팅)

## 🏗️ 시스템 개요

### 주요 기능
- ✅ 단일/배치 알림 발송
- ✅ 사용자별 알림 발송
- ✅ 토픽 기반 알림 발송
- ✅ 자동 재시도 로직
- ✅ 상세한 오류 로깅
- ✅ 알림 템플릿 시스템
- ✅ 무효한 토큰 자동 정리
- ✅ 관리자 오류 알림

### 알림 타입
```javascript
NOTIFICATION_TYPES = {
  SETTLEMENT_COMPLETE: 'settlement_complete',    // 정산 완료
  AD_STATUS_CHANGE: 'ad_status_change',         // 광고 상태 변경
  PAYMENT_RECEIVED: 'payment_received',         // 결제 완료
  SYSTEM_ANNOUNCEMENT: 'system_announcement',   // 시스템 공지
  WORKER_GRADE_UPDATE: 'worker_grade_update'    // 시공기사 등급 업데이트
}
```

## ⚙️ 설치 및 설정

### 1. 환경 변수 설정
```bash
# .env 파일에 추가
FIREBASE_PROJECT_ID=your-project-id
SENDGRID_API_KEY=your-sendgrid-key  # 선택사항
```

### 2. Firebase Console 설정
1. Firebase Console → Project Settings → Cloud Messaging
2. Web Push certificates 생성
3. VAPID 키 생성 및 환경 변수에 추가

### 3. 서비스 워커 등록
`public/firebase-messaging-sw.js` 파일이 자동으로 등록됩니다.

## 📱 사용법

### 1. 단일 알림 발송

```javascript
// HTTP 요청
POST /sendPushNotification
{
  "token": "fcm_token_here",
  "title": "알림 제목",
  "body": "알림 내용",
  "data": {
    "customKey": "customValue"
  }
}
```

### 2. 사용자별 알림 발송

```javascript
// HTTP 요청
POST /sendNotificationToUser
{
  "userId": "advertiser_id",
  "type": "settlement_complete",
  "customData": {
    "settlementId": "settlement_123",
    "amount": 50000
  }
}
```

### 3. 배치 알림 발송

```javascript
// HTTP 요청
POST /sendBatchNotifications
{
  "notifications": [
    {
      "token": "token1",
      "title": "제목1",
      "body": "내용1"
    },
    {
      "token": "token2", 
      "title": "제목2",
      "body": "내용2"
    }
  ]
}
```

### 4. 토픽 알림 발송

```javascript
// HTTP 요청
POST /sendTopicNotification
{
  "topic": "all_advertisers",
  "title": "전체 공지",
  "body": "모든 광고주에게 전달되는 공지사항입니다."
}
```

### 5. Firestore 트리거 사용

```javascript
// 정산 완료 시 자동 알림
exports.onSettlementComplete = functions.firestore
  .document('advertiserSettlements/{settlementId}')
  .onCreate(async (snap, context) => {
    const settlementData = snap.data();
    await sendNotificationToUser(
      settlementData.advertiserId,
      NOTIFICATION_TYPES.SETTLEMENT_COMPLETE,
      {
        settlementId: context.params.settlementId,
        amount: settlementData.amount
      }
    );
  });
```

## 🚨 오류 처리

### 1. 기본 오류 처리

```javascript
try {
  await admin.messaging().send(message);
} catch (error) {
  console.error("푸시 발송 오류:", error);
  
  // 오류 로그 저장
  await logNotificationError(notificationData, error);
  
  // 관리자에게 오류 알림
  await sendErrorAlertToAdmin(error, context);
}
```

### 2. 재시도 로직

```javascript
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`재시도 ${attempt}/${maxRetries}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};
```

### 3. 토큰 유효성 검사

```javascript
const validateToken = (token) => {
  return token && typeof token === 'string' && token.length > 0;
};
```

### 4. 오류 타입별 처리

```javascript
catch (error) {
  switch (error.code) {
    case 'messaging/invalid-registration-token':
      // 무효한 토큰 - 사용자에서 제거
      await removeInvalidToken(userId);
      break;
      
    case 'messaging/registration-token-not-registered':
      // 등록되지 않은 토큰 - 사용자에서 제거
      await removeInvalidToken(userId);
      break;
      
    case 'messaging/quota-exceeded':
      // 할당량 초과 - 지연 후 재시도
      await delayAndRetry();
      break;
      
    default:
      // 기타 오류 - 로그 저장
      await logNotificationError(data, error);
  }
}
```

## 🧪 테스트

### 1. 단일 테스트 알림

```javascript
// HTTP 요청
POST /sendTestNotification
{
  "advertiserId": "test_user_id",
  "testType": "settlement"  // settlement, ad_status, payment, system, custom
}
```

### 2. 전체 테스트 알림

```javascript
// HTTP 요청
POST /sendTestNotificationToAll
{
  "testType": "custom",
  "title": "전체 테스트 알림",
  "body": "모든 광고주에게 전송되는 테스트 알림입니다."
}
```

### 3. 알림 통계 조회

```javascript
// HTTP 요청
GET /getNotificationStats?advertiserId=optional_user_id
```

### 4. 테스트 응답 예시

```javascript
{
  "success": true,
  "messageId": "projects/xxx/messages/yyy",
  "testType": "settlement",
  "advertiserId": "test_user_id"
}
```

## 📊 모니터링

### 1. 알림 로그

```javascript
// Firestore 컬렉션: notificationLogs
{
  token: "fcm_token",
  title: "알림 제목",
  body: "알림 내용",
  data: { customData: "value" },
  messageId: "message_id",
  type: "settlement_complete",
  timestamp: Timestamp,
  status: "sent"
}
```

### 2. 오류 로그

```javascript
// Firestore 컬렉션: notificationErrors
{
  token: "fcm_token",
  title: "알림 제목", 
  body: "알림 내용",
  data: { customData: "value" },
  error: {
    message: "오류 메시지",
    code: "오류 코드",
    stack: "스택 트레이스"
  },
  timestamp: Timestamp,
  status: "failed"
}
```

### 3. 통계 조회

```javascript
// 알림 통계 응답
{
  "success": true,
  "stats": {
    "totalSent": 150,
    "totalErrors": 5,
    "successRate": "96.67",
    "recentLogs": [...],
    "recentErrors": [...]
  }
}
```

## 🔧 트러블슈팅

### 1. 일반적인 문제

#### 토큰이 생성되지 않음
- 브라우저 알림 권한 확인
- VAPID 키 설정 확인
- 서비스 워커 등록 확인

#### 알림이 수신되지 않음
- FCM 토큰 유효성 확인
- 브라우저 알림 설정 확인
- 네트워크 연결 상태 확인

#### 오류 발생 시
- Firebase Console 로그 확인
- 알림 오류 로그 조회
- 토큰 정리 함수 실행

### 2. 디버깅 명령어

```bash
# 함수 로그 확인
firebase functions:log

# 특정 함수 로그 확인
firebase functions:log --only sendPushNotification

# 실시간 로그 확인
firebase functions:log --tail
```

### 3. 성능 최적화

```javascript
// 배치 처리로 성능 향상
const batchSize = 500;
const batches = [];

for (let i = 0; i < notifications.length; i += batchSize) {
  batches.push(notifications.slice(i, i + batchSize));
}

for (const batch of batches) {
  await sendBatchNotifications(batch);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
}
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. Firebase Console → Functions → Logs
2. Firestore → notificationLogs, notificationErrors 컬렉션
3. 브라우저 개발자 도구 → Console
4. 네트워크 탭에서 FCM 요청 상태

추가 지원이 필요하면 관리자에게 문의하세요. 